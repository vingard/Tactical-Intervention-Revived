import fs from "fs"
import axios from "axios"
import path from "path"
import jetpack from "fs-jetpack"
import EventEmitter from "events"

import * as appPath from "./appPath"
import * as config from "./config"
import * as files from "./files"
// eslint-disable-next-line import/no-cycle
import * as mod from "./mod"

const REPO_URL = "https://github.com/vingard/Tactical-Intervention-Revived"

export function checkInstalled() {
    let patchMark = false
    try {
        fs.readFileSync(`${appPath.mountDir}/PATCHED`)
        patchMark = true
    } catch (err) { /* empty */ }

    const conf = config.read()
    conf.gameDownloaded = patchMark
    config.update(conf)

    return conf.gameDownloaded
}

async function getRemotePackage() {
    let remotePackage
    const remotePackageUrl = `${REPO_URL.replace("github.com", "raw.githubusercontent.com")}/main/package.json`

    try {
        remotePackage = await (await axios.get(remotePackageUrl)).data
    } catch (err) {
        throw new Error(`Error reading the remote package.json file (${err})`)
    }

    return remotePackage
}


export async function installGame(overrideUrl?: string) {
    console.log("Patching game...")

    let url = overrideUrl

    // Get content download URL from remote
    if (!overrideUrl) {
        console.log("Getting remote 'package.json' file...")
        const remotePackage = await getRemotePackage()

        if (!remotePackage.patchedContentUrl) {
            throw new Error("No 'patchedContentUrl' in remote package.json!")
        }

        url = remotePackage.patchedContentUrl
    }

    if (!url) throw new Error("Failed to get game content download URL")

    const destination = appPath.baseContentDir
    const tempFileName = "patched_content.zip"

    // Wait 1 second to prevent spam
    //await new Promise(resolve => setTimeout(resolve, 1000))

    // Download patched content to a temp file
    console.log("Downloading patched content:")
    await files.downloadTempFile(url, tempFileName)

    // Extract
    console.log("Extracting patched content...")
    await files.extractArchive(path.resolve(appPath.tempDir, tempFileName), destination)

    // Remove old content
    console.log("Removing old content...")

    // Remove all the default .fpx files from /tacint dir
    fs.readdirSync(appPath.tacintDir).forEach(file => {
        if (file.endsWith(".fpx")) {
            try {
                fs.unlinkSync(path.resolve(appPath.tacintDir, file)) // remove file
            } catch (err) {
                throw new Error(`Failed to remove ${file}! ${err}`)
            }
        }
    })

    // Cleanup and mark as patched
    console.log("Finishing up...")
    await files.deleteTempFile(tempFileName)

    // Write PATCHED file
    try {
        fs.writeFileSync(path.resolve(appPath.mountDir, "PATCHED"), "PATCHED BY Tactical Intervention Mod Manager")
    } catch (err) {
        throw new Error(`Failed to write the PATCHED file! ${err}`)
    }

    // Final check
    const isPatched = checkInstalled()

    if (!isPatched) {
        throw new Error("Something went wrong, please retry the patch :(")
    }

    //console.log(successColor("Game patched successfully!"))
}

export function getMountManifest() {
    const conf = config.read()
    return conf.mountManifest || {}
}


export async function mountFile(filePath: string, from: string, to: string, modName?: string) {
    await jetpack.dirAsync(path.resolve(to, path.dirname(filePath))) // creates a directory to this file in the to dir

    const fromFull = path.resolve(from, filePath)
    const toFull = path.resolve(to, filePath)
    const manifest = getMountManifest()
    const mods = mod.getAll()

    // If link file exists, we'll remove it and replace
    if (await jetpack.existsAsync(toFull)) {
        await jetpack.removeAsync(toFull)
    }

    try {
        // create symlink
        await jetpack.symlinkAsync(
            fromFull,
            toFull
        )
    } catch(err: any) {
        if (err.code === "EPERM") {
            throw new Error(`Mounting permissions error! ${err}`)
        } else {
            throw new Error(`Error mounting file! ${err}`)
        }
    }

    if (manifest[filePath]) {
        const conf = config.read()
        const otherMod = mods[mod.getLoadOrder(manifest[filePath])] // the mod being overwritten

        if (otherMod && otherMod.name !== modName && otherMod.claims) {
            // the other mod has been booted off this symlink
            // Update the config to reflect this change
            conf.mods[mod.getIndex(conf, otherMod.name)].claims[filePath] = false
            config.update(conf)
        }
    }
}

/** Un-mounts a file, if another file was mounted to replace it, this method will return true */
export async function unMountFile(filePath: string, from: string, to: string, modName: string) {
    const toFull = path.resolve(to, filePath)

    if (await jetpack.existsAsync(toFull)) {
        await jetpack.removeAsync(toFull)
    }

    // Now, we should work out if something else needs to be mounted here. Honestly this should probably be moved out of this function at some point.

    // First, let's get all the mods, sorted by priority
    const mods = mod.getAll()
    const sortedMods = [...mods].sort((a, b) => b.priority - a.priority)

    // eslint-disable-next-line no-restricted-syntax
    for (const thisMod of sortedMods) {
        if (!thisMod.mounted || thisMod.name === modName) {
            // eslint-disable-next-line no-continue
            continue
        }

        if (thisMod.mounted && thisMod.claims?.[filePath] !== undefined) { // if any mod has a claim to a file, mount it
            // eslint-disable-next-line no-await-in-loop
            await mountFile(filePath, path.resolve(appPath.modsDir, thisMod.name), to)

            // Update the config to reflect this change
            const conf = config.read()
            conf.mountManifest[filePath] = thisMod.name
            conf.mods[mod.getIndex(conf, thisMod.name)].claims[filePath] = true
            config.update(conf)
            return true
        }
    }

    // TODO: Stop editing the manifest from within the unmounting util methods
    // move it into the unMount mod loop to make it consistent and more efficient!

    // At this stage, no mod has a claim, so the manifest should be cleared
    const conf = config.read()
    conf.mountManifest[filePath] = undefined
    config.update(conf)

    // If not, we'll check if the base content has a claim
    const baseContentFs = jetpack.cwd(appPath.baseContentDir)
    if (await baseContentFs.existsAsync(filePath) === "file") {
        await mountFile(filePath, appPath.baseContentDir, to)
        return true
    }

    return false
}

export type ContentType = Record<string, string>

export function mountContent(content: ContentType, from: string, to: string): [EventEmitter, number] {
    const emitter = new EventEmitter()
    const entries = Object.entries(content)
    let i = 1

    process.nextTick(() => {(
        async () => {
            emitter.emit("start", entries.length)

            for (const [filePath, modName] of entries) {
                // eslint-disable-next-line no-await-in-loop
                await mountFile(filePath, from, to, modName)
                emitter.emit("progress", i++)
            }

            emitter.emit("end", i)
        }
    )()})

    return [emitter, entries.length]
}

export async function unMountContent(content: ContentType, from: string, to: string) {
    for (const [filePath, modName] of Object.entries(content)) {
        // eslint-disable-next-line no-await-in-loop
        await unMountFile(filePath, from, to, modName)
    }

    files.cleanupModContentLeftovers(from, to)
}
