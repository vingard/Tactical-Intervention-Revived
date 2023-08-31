import fs from "fs"
import axios from "axios"
import path from "path"
import jetpack from "fs-jetpack"
import EventEmitter from "events"
import log from "electron-log"
import { readVdf, writeVdf } from "steam-binary-vdf"

import { shell } from "electron"
import { spawn } from "child_process"
import * as appPath from "./appPath"
import * as config from "./config"
import * as files from "./files"
// eslint-disable-next-line import/no-cycle
import * as mod from "./mod"
// eslint-disable-next-line import/no-self-import

// eslint-disable-next-line import/no-cycle
import { isDebug } from "../main"
import { loadingReset, loadingSetError, loadingSetState } from "./util"
import { SoftError } from "./softError"

const REPO_URL = "https://github.com/vingard/Tactical-Intervention-Revived"

export function checkInstalled() {
    let patchMark = false
    try {
        fs.readFileSync(path.resolve(appPath.mountDir, "PATCHED"))
        patchMark = true
    } catch (err) { /* empty */ }

    const conf = config.read()
    conf.gameDownloaded = patchMark
    config.update(conf)

    return conf.gameDownloaded
}

async function getRemotePackage() {
    let remotePackage
    const remotePackageUrl = `${REPO_URL.replace("github.com", "raw.githubusercontent.com")}/${isDebug && "dev" || "main"}/package.json`

    try {
        remotePackage = await (await axios.get(remotePackageUrl)).data
    } catch (err: any) {
        throw new SoftError(`Error reading the remote package.json file (${err.message || err})`)
    }

    return remotePackage
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
            throw new SoftError(`Mounting permissions error - make sure you are running this program as Administrator! ${err.message}`)
        } else {
            throw new SoftError(`Error mounting file! ${err.message}`)
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
    let i = 0

    process.nextTick(() => {(
        async () => {
            emitter.emit("start", entries.length)

            for (const [filePath, modName] of entries) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await mountFile(filePath, from, to, modName)
                } catch (err: any) {
                    emitter.emit("error", err.message)
                }
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

export async function mountBaseContent() {
    const baseContentFs = jetpack.cwd(appPath.baseContentDir)
    const mountFs = jetpack.cwd(appPath.mountDir)
    const contentsTemp = await baseContentFs.findAsync(".", {directories: false, recursive: true})
    const contents: any = {}
    let completed = 0

    for (const filePath of contentsTemp) {
        // eslint-disable-next-line no-await-in-loop
        if (await mountFs.existsAsync(filePath) !== "file") {
            contents[filePath] = "_BaseGameContent"
        }

        loadingSetState("game", "Preparing to mount game files", completed++, contentsTemp.length)
    }

    const [emitter, totalFiles] = mountContent(contents, appPath.baseContentDir, appPath.mountDir)
    loadingSetState("game", "Starting mount...")

    emitter.on("progress", (totalCompleted) => loadingSetState("game", "Mounting", totalCompleted, totalFiles))
    emitter.once("error", (errMessage) => {throw new SoftError(errMessage, "game")})

    return new Promise<void>(function (resolve, reject) {
        emitter.once("end", () => resolve())
    })
}

export async function installGame(overrideUrl?: string) {
    loadingReset("game")

    log.info("Installing game")

    let url = overrideUrl

    // Get content download URL from remote
    if (!overrideUrl) {
        log.info("Getting remote 'package.json' file...")
        loadingSetState("game", "Getting remote 'package.json' file...")

        const remotePackage = await getRemotePackage()

        if (!remotePackage.contentUrl) {
            throw new SoftError("No 'contentUrl' in remote package.json!")
        }

        url = remotePackage.contentUrl
    }

    if (!url) throw new SoftError("Failed to get game content download URL")

    const destination = appPath.workingDir
    const tempFileName = "game_content.zip"

    // Download patched content to a temp file
    log.info("Downloading game content")
    await files.downloadTempFile(url, tempFileName, "game")

    // Extract
    log.info("Extracting game content")
    await files.extractArchive(path.resolve(appPath.tempDir, tempFileName), destination, "game")

    // Cleanup and mark as patched
    loadingSetState("game", "Finishing up...")
    await files.deleteTempFile(tempFileName)

    // Write PATCHED file
    try {
        fs.writeFileSync(path.resolve(appPath.baseContentDir, "PATCHED"), "PATCHED BY Tactical Intervention Mod Manager")
    } catch (err) {
        throw new SoftError(`Failed to write the PATCHED file! ${err}`)
    }

    // Mount
    log.info("Mounting base game content")
    await mountBaseContent()

    // Final check
    const isPatched = checkInstalled()

    if (!isPatched) {
        throw new SoftError("Something went wrong, please retry the install :(")
    }

    loadingSetState("game", "Game installed successfully!", 1, 1)
}

export function getMountManifest() {
    const conf = config.read()
    return conf.mountManifest || {}
}

export async function setUsername(username: string) {
    const settingFs = jetpack.cwd(appPath.settingsDir)

    log.info(`Attempting to set username to ${username}`)

    try {
        settingFs.write("account_name.txt", username)
    } catch(err) {
        throw new SoftError(`Failed to set username! ${err}`)
    }
}

export async function getUsername() {
    const settingFs = jetpack.cwd(appPath.settingsDir)

    try {
        return settingFs.read("account_name.txt")
    } catch(err) {
        throw new SoftError(`Failed to get username! ${err}`)
    }
}

export async function setCfg(content: string, filename: string = "revived.cfg") {
    log.info(`Setting ${filename} to:\nSTART CFG\n${content}\nEND CFG`)

    try {
        jetpack.write(path.resolve(appPath.cfgDir, filename), content)
    } catch(err) {
        throw new SoftError(`Failed to set ${filename}! ${err}`)
    }
}

export async function getCfg(filename: string = "revived.cfg") {
    try {
        return jetpack.read(path.resolve(appPath.cfgDir, filename))
    } catch(err) {
        throw new SoftError(`Failed to read ${filename}! ${err}`)
    }
}

export async function createSteamShortcuts() {
    const steamPath = await files.findSteamDir()
    if (!steamPath) return log.warn("Failed to find Steam directory!")

    const userDataPath = path.resolve(steamPath, "userdata")
    if (!jetpack.exists(userDataPath)) return log.warn("Failed to find Steam/userdata directory!")
    const userDirs = jetpack.find(userDataPath, {directories: true, files: false, recursive: false})

    for (const dirPath of userDirs) {
        const shortcutPath = path.resolve(dirPath, "config", "shortcuts.vdf")
        if (!jetpack.exists(shortcutPath)) jetpack.write(shortcutPath, writeVdf({shortcuts: {}}))
        // eslint-disable-next-line no-await-in-loop
        const inBuffer = await jetpack.readAsync(shortcutPath, "buffer")
        if (!inBuffer) {
            log.warn("Failed to read .vdf buffer!")
            continue
        }

        const shortcuts: any = readVdf(inBuffer)
        if (!shortcuts.shortcuts) continue

        let alreadyExists = false
        // eslint-disable-next-line guard-for-in
        for (const key in shortcuts.shortcuts) {
            // If shortcut already exists, skip creation
            if (shortcuts.shortcuts[key].exe === appPath.exePath) alreadyExists = true
        }

        if (alreadyExists) continue

        const shortcut = {
            AppName: `Tactical Intervention Revived ${isDebug && "(dev)"}`,
            exe: appPath.exePath,
            StartDir: appPath.workingDir
        }

        shortcuts.shortcuts.tacint_revived = shortcut

        try {
            log.info(`Creating Steam shortcut at ${shortcutPath}`)
            jetpack.write(shortcutPath, writeVdf(shortcuts))
        } catch(err) {
            log.error(`Failed to make ${shortcutPath}`, err)
        }
    }
}

export async function setTempCfg(content: string) {
    let baseCfg = await getCfg("default.cfg")
    const includeTemp = "exec \"_temp.cfg\""

    if (baseCfg && !baseCfg.includes(includeTemp)) {
        baseCfg = `${includeTemp}\n${baseCfg}`
        await setCfg(baseCfg, "default.cfg")
    }

    await setCfg(content, "_temp.cfg")
}

export async function start(args: string = "") {
    log.info(`Attempting to start game with args: ${args}`)

    await setTempCfg(args)
    const instance = spawn(`${appPath.gamePath}`)

    instance.on("exit", (code) => {
        //setTempCfg("")
        //console.log("game closed")
    })
}
