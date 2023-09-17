import fs from "fs"
import path from "path"
import axios from "axios"
import onezip from "onezip"
import jetpack from "fs-jetpack"
import byteSize from "byte-size"
import log from "electron-log"
import {rimraf} from "rimraf"
//import drivelist from "drivelist"
// eslint-disable-next-line import/no-cycle
import * as appPath from "./appPath"
import { loadingSetState } from "./util"
import { SoftError } from "./softError"

export function createDirIfNotExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }

    return dirPath
}

export function errorIfDirNotExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        throw new SoftError(`The '${dirPath}' folder is missing!`)
    }

    return dirPath
}

export function tryToRemoveFile(filePath: string) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
    }
}

export function tryToRemoveDirectory(dirPath: string) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true })
    }
}

export function getDirectories(dirPath: string) {
    return fs.readdirSync(dirPath).filter(function(fileName) {
        return fs.statSync(path.resolve(dirPath, fileName)).isDirectory()
    })
}

function isDateWithinLast(checkDate: Date, minutes: number) {
    // Get the current date and time
    const currentDate = new Date()

    // Calculate the time one hour ago
    const timeAgo = new Date(currentDate)
    timeAgo.setMinutes(currentDate.getMinutes() - minutes)

    // Compare the given date with the calculated time
    return checkDate >= timeAgo && checkDate <= currentDate
}

export async function downloadTempFile(url: string, name: string, loadStateId: string, acceptNoContentLength: boolean = false, partialAutoRetries: number = 64) {
    let abortController: AbortController
    let contentHash!: string

    loadingSetState(loadStateId, "Starting download...")

    async function startOrContinueDownload() {
        let resp

        if (abortController) {
            abortController.abort()
        }

        abortController = new AbortController()

        const savePath = path.resolve(appPath.tempDir, name)
        let fileOffset

        if (partialAutoRetries && jetpack.exists(savePath)) {
            const stats = jetpack.inspect(savePath, {times: true})

            // If the file was modified within the last 8 hours, we'll continue the download. Otherwise, its
            // probably best to start fresh
            if (stats?.modifyTime && isDateWithinLast(stats.modifyTime, 8 * 60)) {
                fileOffset = stats.size
            }
        }

        let totalLength: number

        try {
            const query = await axios({
                url,
                method: "HEAD",
                headers: {"Accept-Encoding": null},
                timeout: 5000
            })

            const {headers} = query

            contentHash = contentHash || headers.etag // grab the conentHash from etag, or use the existing one, in case the remote source changes mid download
            totalLength = parseInt(headers["content-length"] || headers["Content-Length"] || 0, 10) // try to get download file size
        } catch(err: any) {
            throw new SoftError(`Failed to query download source! ${err.message}`)
        }

        // if the file is already downloaded, stop download!
        if (totalLength !== 0 && fileOffset === totalLength) return {}

        try {
            resp = await axios({
                url,
                method: "GET",
                responseType: "stream",
                headers: {
                    "Accept-Encoding": null,
                    "Range": fileOffset && `bytes=${fileOffset}-`
                },
                timeout: (60000 * 8), // 8 minute connection timeout
                signal: abortController.signal
            })
        } catch (err: any) {
            throw new SoftError(`Download init failed! ${err.message}`)
        }

        // extract from response
        const { data, headers } = resp
        let downloadedLength = fileOffset || 0
        totalLength = totalLength || parseInt(headers["content-length"] || headers["Content-Length"] || 0, 10) // try to get download file size

        if (totalLength <= 0 && !acceptNoContentLength) throw new SoftError("Download failed - failed to find archive")

        try {
            const writer = fs.createWriteStream(savePath, {flags: fileOffset && "a" || undefined}) // append IF we are continuing parial dl

            data.on("data", (chunk: any) => loadingSetState(
                loadStateId,
                `Downloading ${byteSize(downloadedLength)}/${byteSize(totalLength)}`,
                (downloadedLength += chunk.length) / totalLength,
                1
            ))

            data.pipe(writer)
        } catch (err) {
            throw new SoftError(`Download failed! ${err}`)
        }

        // eslint-disable-next-line func-names
        return new Promise<any>(function(resolve) {
            data.once("error", (err: any) => {
                resolve(<any>{error: err.message})
            })
            // Return the contentHash if succesful
            data.once("end", () => {
                resolve(<any>{})
            })
        })
    }

    if (partialAutoRetries === 0) {
        const {error} = await startOrContinueDownload()
        if (error) throw new SoftError(`Download failed - ${error}`)
        return contentHash
    }

    let retryableErrMessage: any

    for (let attempt = 1; attempt <= partialAutoRetries; attempt++) {
        // eslint-disable-next-line no-await-in-loop
        const {error} = await startOrContinueDownload()
        retryableErrMessage = error

        if (!retryableErrMessage) return contentHash // we are done!
        log.warn(`Download error - ${retryableErrMessage}`)
        log.info(`Retrying download... (attempt ${attempt}/${partialAutoRetries})`)
    }

    throw new SoftError(`Download failed - Too many errors: ${retryableErrMessage || "Unknown"}`)
}

export async function deleteTempFile(name: string) {
    try {
        fs.unlinkSync(path.resolve(appPath.tempDir, name))
    } catch (err) { /* empty */ }
}

export async function extractArchive(archive: string, destination: string, loadStateId: string) {
    loadingSetState(loadStateId, "Starting extraction...")
    let extract: any

    try {
        extract = onezip.extract(archive, destination)
    } catch (err) {
        throw new SoftError(`Error extracting archive! ${err}`)
    }

    extract.once("error", (err: any) => {
        throw new SoftError(`Error extracting archive! ${err}`, loadStateId)
    })

    extract.on("progress", (perc: number) => {
        loadingSetState(loadStateId, "Extracting", perc / 100, 1)
    })

    return new Promise<void>(function(resolve) {
        extract.once("end", () => resolve())
    })
}

/** This moves all the files in one directory up and then deletes the directory they were in.
 * This is done to fix how GitHub provides archives of source code.
 */
export async function gitFileFix(dirPath: string) {
    const dirs = getDirectories(dirPath)

    if (!dirs[0]) {
        throw new SoftError("Git file fix has gone wrong!")
    }

    const source = dirs[0]
    const tmpName = `${dirPath}_tmp_gitfix`

    // This is a stupid hack...
    jetpack.move(path.resolve(dirPath, source), tmpName, {overwrite: true})
    jetpack.move(tmpName, dirPath, {overwrite: true})
}

/** This method exists to cleanup leftover directories that are empty from unmounting **/
export async function cleanupModContentLeftovers(from: string, to: string) {
    const fromFs = jetpack.cwd(from)
    const toFs = jetpack.cwd(to)

    if(!fromFs || !toFs) {
        throw new SoftError("Failed to")
    }

    const fromDirs = fromFs.find(".", {directories: true, files: false, recursive: false})

    for (const dirPath of fromDirs) {
        // If toFs dir is not empty...
        if (toFs.list(dirPath)?.length !== 0) {
            // Cleanup this dir
            cleanupModContentLeftovers(
                path.resolve(from, dirPath),
                path.resolve(to, dirPath)
            )

            // If after cleanup, this dir is still not empty, then ignore
            if (toFs.list(dirPath)?.length !== 0) {
                continue
            }
        }

        // Remove empty folder
        toFs.remove(dirPath)
    }
}

export async function findSteamDir() {
    const drives = ["C:", "D:", "E:", "F:", "G:", "H:"]

    for (const drive of drives) {
        const dirPath = path.resolve(drive, "Program Files (x86)", "Steam")
        if (jetpack.exists(path.resolve(dirPath, "steam.exe"))) return dirPath
    }
}

// Need this because of random permissions errors that dont do anything? Weird - probably some symlinks behaving badly
// Update, see: https://stackoverflow.com/a/61210717
export async function tryRemove(filePath: string) {
    if (jetpack.exists(filePath) !== "dir") return

    try {
        console.log("rm", filePath)
        await rimraf.windows(filePath, {maxRetries: 12, retryDelay: 300}) // rimraf is used here cause turns out this can be a real pain, see comment above
    } catch (err: any) {
        log.warn(`Error when removing ${filePath} - ${err.message} - contuining!`)
    }
}
