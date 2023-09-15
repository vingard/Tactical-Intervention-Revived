import axios from "axios"
import path from "path"
import jetpack from "fs-jetpack"
import log from "electron-log"
import { getWindow } from "../main"
import * as config from "./config"
import * as files from "./files"
// eslint-disable-next-line import/no-cycle
import * as game from "./game"
import * as appPath from "./appPath"
import { SoftError } from "./softError"
import { loadingReset, loadingSetState } from "./util"

export async function getInfo(location: string, isFileSystem: boolean = false) {
    let modInfo

    if (isFileSystem) {
        let modInfoFile
        const modInfoFilePath = path.resolve(location, "mod.json")

        try {
            modInfoFile = await jetpack.readAsync(modInfoFilePath)
        } catch (err) {
            throw new SoftError(`Could not find a valid mod at ${location} (${err})`)
        }

        try {
            modInfo = JSON.parse(<string>modInfoFile)
        } catch (err) {
            throw new SoftError(`Failed to parse JSON for ${modInfoFilePath}`)
        }
    } else {
        try {
            modInfo = (await axios.get(`${location.replace("github.com", "raw.githubusercontent.com")}/main/mod.json`)).data
        } catch (err) {
            throw new SoftError(`Could not find a valid mod at ${location} (${err})`)
        }
    }

    if (!modInfo.uid) {
        throw new SoftError("Mod does not provide a 'uid' in its mod.json file, this is required!")
    }

    if (!modInfo.name) {
        throw new SoftError("Mod does not provide a 'name' in its mod.json file, this is required!")
    }

    if (typeof modInfo.uid !== "string") {
        throw new SoftError("Mod 'uid' must be a string!")
    }

    if (typeof modInfo.name !== "string") {
        throw new SoftError("Mod 'name' must be a string!")
    }

    if (modInfo.version && typeof modInfo.version !== "string") {
        throw new SoftError("Mod 'version' must be a string!")
    }

    modInfo.uid = `${modInfo.uid.toLowerCase()}${!isFileSystem && "-DL" || ""}`
    modInfo.version = modInfo.version || "0.0.1"
    modInfo.url = !isFileSystem && location

    return modInfo
}


export function isValidURL(url: string) {
    return url.startsWith("https://github.com")
}

export function get(name: string) {
    const conf = config.read()
    const i = conf.mods.findIndex((x: any) => x.uid === name)

    return conf.mods[i]
}

export function getAll() {
    const conf = config.read()
    return conf.mods
}

export function getLoadOrder(mod: any) {
    return mod.priority || 0
}

export function getIndex(conf: any, modName: string) {
    return conf.mods.findIndex((x: any) => x.uid === modName)
}

async function addToConfig(mod: any, shouldMerge: boolean = false) {
    // Append to timm.json the mod info
    const conf = config.read()
    const foundIndex = conf.mods.findIndex((x: any) => x.uid === mod.uid)

    let newMod = {}

    // If mod exists replace otherwise append
    if (foundIndex === -1) {
        newMod = mod
        conf.mods.push(newMod)
    } else {
        newMod = shouldMerge && {...conf.mods[foundIndex], ...mod} || mod
        conf.mods[foundIndex] = newMod
    }

    config.update(conf)
    return newMod
}

async function updateState() {
    const win = getWindow()!
    if (!win) return
    win.webContents.send("mod:setState", await getAll())
}

export async function createNew(uid: string, name: string, description?: string, author?: string, version: string = "0.0.1") {
    log.info(`Creating new mod: ${name} ${uid}`)

    const modData = {
        uid,
        name,
        description,
        version,
        author
    }

    const newModDir = jetpack.cwd(path.resolve(appPath.modsDir, uid))
    await newModDir.dirAsync(".") // make mod folder
    await newModDir.writeAsync("mod.json", JSON.stringify(modData, undefined, "  ")) // make mod.json file

    addToConfig(modData)
    updateState()
}

/** Installs a mod from a GitHub repository URL. */
export async function install(url: string) {
    // Get mod.json file info
    // get title, version, store in timm.json mods
    const mod = await getInfo(url)
    const modPath = path.resolve(appPath.modsDir, mod.uid)
    const modTempFileName = `${mod.uid}.zip`

    const modLoadStateId = `mod_${mod.uid}`
    loadingReset(modLoadStateId)

    // If mod is already installed prompt?

    log.info(`Installing ${mod.uid} (${mod.version}):`)

    // Download archive
    log.info(`Downloading from ${mod.url}`)
    await files.downloadTempFile(`${mod.url}/archive/refs/heads/main.zip`, modTempFileName, modLoadStateId, true)

    // Make mods folder and remove old install
    await files.tryToRemoveDirectory(modPath)
    await files.createDirIfNotExists(modPath)

    const archivePath = path.resolve(appPath.tempDir, modTempFileName)

    // Extract to mods folder
    log.info(`Extracting ${archivePath} to ${modPath}`)
    await files.extractArchive(archivePath, modPath, modLoadStateId)

    // Move all files up one directory and cleanup the mess
    await files.gitFileFix(modPath)

    // Remove mod info and git files from mod
    log.info("Finishing up...")
    loadingSetState(modLoadStateId, "Finishing up...")

    files.tryToRemoveFile(path.resolve(modPath, ".gitignore"))
    files.tryToRemoveFile(path.resolve(modPath, ".gitattributes"))
    files.tryToRemoveFile(path.resolve(modPath, "mod.json"))

    files.tryToRemoveDirectory(path.resolve(modPath, ".git"))

    // Cleanup archive
    await files.deleteTempFile(modTempFileName)

    // Add to config
    addToConfig(mod)

    const succMsg = `${mod.name} - ${mod.uid} (${mod.version}) was installed succesfully!`
    log.info(succMsg)
    loadingSetState(modLoadStateId, succMsg, 1, 1, true)
    updateState()

    return mod
}

const MOD_CONTENT_DIRS = [
    "resource",
    "particles",
    "sound",
    "models",
    "materials",
    "scripts",
    "media",
    "maps",
    "cfg"
]

export async function mountMod(mod: any) {
    const modLoadingStateId = `mod_${mod.uid}`
    loadingReset(modLoadingStateId)

    const modFolder = path.resolve(appPath.modsDir, mod.uid)
    const modFs = jetpack.cwd(modFolder)
    let modContentsTemp: any = []

    // Mount only content inside MOD_CONTENT_DIRS, this is done mostly to support git, and just generally to be nice and clean :)
    // eslint-disable-next-line guard-for-in
    for (const dir of MOD_CONTENT_DIRS) {
        if (modFs.exists(dir) !== "dir") continue
        modContentsTemp = [...modContentsTemp, ...modFs.find(dir, {directories: false, recursive: true})]
    }

    const modContents: any = {}
    for (const filePath of modContentsTemp) {
        modContents[path.normalize(filePath)] = mod.uid
    }

    const mods = getAll()
    const manifest = game.getMountManifest()
    const manifestDiff: any = {}
    const claims: any = {}
    const myPriority = getLoadOrder(mod)
    let conf = config.read()
    let completed = 0
    const modFiles = Object.entries(modContents)

    for (const [k, v] of modFiles) {
        loadingSetState(modLoadingStateId, "Preparing to mount game files", completed++, modFiles.length)
        claims[k] = false

        // If the mounted file has conflict
        if (manifest[k]) {
            const ownerMod = mods[getIndex(conf, manifest[k])]

            if (ownerMod && ownerMod.uid !== mod.uid) {
                // If the owner mod has greater or (equal to load order - however equal to should never happen ideally)
                if (getLoadOrder(ownerMod) >= myPriority) {
                    claims[k] = false
                    continue
                }
            }
        }

        // Mount file
        manifest[k] = v
        manifestDiff[k] = v
        claims[k] = true
    }

    // Mount the difference from the mods local folder into the mountDir
    try {
        await (async () => {
            const [emitter, totalFiles] = game.mountContent(manifestDiff, modFolder, appPath.mountDir)
            loadingSetState(modLoadingStateId, "Starting mount...")

            emitter.on("progress", (totalCompleted) => loadingSetState(modLoadingStateId, "Mounting", totalCompleted, totalFiles))
            emitter.once("error", (errMessage) => {throw new SoftError(errMessage, modLoadingStateId)})

            return new Promise<void>(function(resolve, reject) {
                emitter.once("end", () => resolve())
            })
        })()
    } catch(err: any) {
        console.log(err)
    }


    conf = config.read()
    const modIndex = getIndex(conf, mod.uid)
    conf.mountManifest = manifest
    conf.mods[modIndex].mounted = true
    conf.mods[modIndex].claims = claims
    config.update(conf)
    updateState()

    loadingSetState(modLoadingStateId, "Mounted succesfully", undefined, undefined, true)

    return conf.mods[modIndex]
}

export async function unMountMod(mod: any) {
    const modLoadingStateId = `mod_${mod.uid}`
    loadingReset(modLoadingStateId)

    const modFolder = path.resolve(appPath.modsDir, mod.uid)
    const modFs = jetpack.cwd(modFolder)

    const manifest = game.getMountManifest()
    const manifestArray = Object.entries(manifest)
    const content: any = {}
    let completed = 0

    for (const [k, v] of manifestArray) {
        loadingSetState(modLoadingStateId, "Preparing to un-mount game files", completed++, manifestArray.length)
        if (v === mod.uid) {
            content[k] = v
        }
    }

    try {
        await (async () => {
            const [emitter, totalFiles] = game.unMountContent(content, modFolder, appPath.mountDir)
            loadingSetState(modLoadingStateId, "Starting un-mount...")

            emitter.on("progress", (totalCompleted) => loadingSetState(modLoadingStateId, "Un-Mounting", totalCompleted, totalFiles))
            emitter.on("cleanupDirs", () => loadingSetState(modLoadingStateId, "Cleaning up leftovers"))
            emitter.once("error", (errMessage) => {throw new SoftError(errMessage, modLoadingStateId)})

            return new Promise<void>(function(resolve, reject) {
                emitter.once("end", () => resolve())
            })
        })()
    } catch(err: any) {
        console.log(err)
    }


    completed = 0
    // TODO: Fix this so it loops through a sorted array of claims to see
    for (const [k, v] of manifestArray) {
        loadingSetState(modLoadingStateId, "Cleaning up manifest", completed++, manifestArray.length)
        if (v === mod.uid) {
            manifest[k] = undefined
        }
    }

    const conf = config.read()
    const modIndex = getIndex(conf, mod.uid)
    //config.mountManifest = manifest
    conf.mods[modIndex].mounted = false
    conf.mods[modIndex].claims = undefined
    config.update(conf)
    updateState()

    loadingSetState(modLoadingStateId, "Un-mounted succesfully", undefined, undefined, true)

    return conf.mods[modIndex]
}

/** This method nukes all the claims and mountManifest wrecklessly, this should only be called if you know you are wiping the game content */
export async function resetAllClaims() {
    const conf = config.read()

    for (const mod of conf.mods) {
        mod.mounted = false
        mod.claims = undefined
    }

    conf.mountManifest = undefined

    config.update(conf)
    updateState()
}

export async function init() {
    updateState()
}

export async function remove(mod: any) {
    const modLoadingStateId = `mod_${mod.uid}`
    loadingReset(modLoadingStateId)

    loadingSetState(modLoadingStateId, "Preparing to delete")
    await unMountMod(mod)

    loadingSetState(modLoadingStateId, "Deleting files")

    const modPath = path.resolve(appPath.modsDir, mod.uid)

    if (jetpack.exists(modPath) === "dir") {
        try {
            jetpack.remove(path.resolve(appPath.modsDir, mod.uid))
        } catch(err: any) {
            throw new Error("Failed to remove mod directory")
        }
    }

    const conf = config.read()
    const modIndex = getIndex(conf, mod.uid)
    conf.mods.splice(modIndex, 1)
    config.update(conf)

    updateState()
    loadingSetState(modLoadingStateId, "Removed succesfully", undefined, undefined, true)
}

/** Syncing can be used to un-mount, sync the mod.json, then re-mount locally installed mods */
export async function sync(mod: any) {
    const remoteModInfo = await getInfo(path.resolve(appPath.modsDir, mod.uid), true)

    if (!mod) { // If mod is not in the revived config, then add it
        addToConfig(remoteModInfo)
        mod = remoteModInfo
    }

    if (mod.mounted) mod = await unMountMod(mod)
    mod = await addToConfig(remoteModInfo, true) // merge mod to config
    mod = await mountMod(mod)
    return mod
}

export async function setPriority(mod: any, priority?: number) {
    // if mod mounted, unmount, set priority, remount
    const wasMounted = mod.mounted
    if (wasMounted) mod = await unMountMod(mod)
    mod.priority = priority
    addToConfig(mod)
    if (wasMounted) mod = await mountMod(mod)

    updateState()
    return mod
}
