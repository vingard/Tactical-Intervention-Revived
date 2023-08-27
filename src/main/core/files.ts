import fs from "fs"
import path from "path"
import axios from "axios"
import onezip from "onezip"
import jetpack from "fs-jetpack"
// eslint-disable-next-line import/no-cycle
import * as appPath from "./appPath"

export function createDirIfNotExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
    }

    return path
}

export function errorIfDirNotExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        throw new Error(`The '${dirPath}' folder is missing!`)
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
    return fs.readdirSync(dirPath).filter(function (fileName) {
        return fs.statSync(path.resolve(dirPath, fileName)).isDirectory()
    })
}

export async function downloadTempFile(url: string, name: string) {
    let resp

    try {
        resp = await axios({
            url,
            method: "GET",
            responseType: "stream",
            headers: { "Accept-Encoding": null }
        })
    } catch (err) {
        throw new Error(`Download failed! ${err}`)
    }

    // extract from response
    const { data, headers } = resp
    const totalLength = headers["content-length"] || headers["Content-Length"] || 564276 // Wild guess??
    // const progressBar = new ProgressBar("-> Downloading [:bar] (:curSize/:maxSize) :percent complete  (:etas seconds remaining)", {
    //     width: 44,
    //     complete: "=",
    //     incomplete: " ",
    //     renderThrottle: 1,
    //     total: parseInt(totalLength)
    // })

    try {
        const writer = fs.createWriteStream(path.resolve(appPath.tempDir, name))

        // data.on("data", (chunk) => progressBar.tick(chunk.length, {
        //     maxSize: byteSize(progressBar.total),
        //     curSize: byteSize(progressBar.curr)
        // }))
        data.pipe(writer)
    } catch (err) {
        throw new Error(`Download failed! ${err}`)
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

export async function extractArchive(archive: string, destination: string) {
    let extract: any

    try {
        extract = onezip.extract(archive, destination)
    } catch (err) {
        throw new Error(`Error extracting archive! ${err}`)
    }

    // const progressBar = new ProgressBar("-> Extracting [:bar] :percent complete  (:etas seconds remaining)", {
    //     width: 44,
    //     complete: "=",
    //     incomplete: " ",
    //     renderThrottle: 1,
    //     total: 100
    // })

    extract.once("error", (err: any) => {
        throw new Error(`Error extracting archive! ${err}`)
    })

    extract.on("progress", (perc: number) => {
        //progressBar.update(perc / 100)
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
        throw new Error("Git file fix has gone wrong!")
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
        throw new Error("Failed to")
    }

    let fromDirs = fromFs.find(".", {directories: true, files: false, recursive: false})

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
