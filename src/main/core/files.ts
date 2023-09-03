import fs from "fs"
import path from "path"
import axios from "axios"
import onezip from "onezip"
import jetpack from "fs-jetpack"
import byteSize from "byte-size"
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

export async function downloadTempFile(url: string, name: string, loadStateId: string, acceptNoContentLength: boolean = false) {
    loadingSetState(loadStateId, "Starting download...")
    let resp

    try {
        resp = await axios({
            url,
            method: "GET",
            responseType: "stream",
            headers: { "Accept-Encoding": null }
        })
    } catch (err) {
        throw new SoftError(`Download failed! ${err}`)
    }

    // extract from response
    const { data, headers } = resp
    let downloadedLength = 0
    const totalLength = parseInt(headers["content-length"] || headers["Content-Length"] || 0, 10) // Wild guess??

    if (totalLength <= 0 && !acceptNoContentLength) throw new SoftError("Download failed - failed to find archive")

    try {
        const writer = fs.createWriteStream(path.resolve(appPath.tempDir, name))

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
    return new Promise<void>(function(resolve) {
        data.once("end", () => resolve())
    })
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
