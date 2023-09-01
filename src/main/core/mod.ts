import axios from "axios"
import path from "path"
import jetpack from "fs-jetpack"
import log from "electron-log"
import * as config from "./config"
import * as files from "./files"
// eslint-disable-next-line import/no-cycle
import * as game from "./game"
import * as appPath from "./appPath"
import { SoftError } from "./softError"
import { loadingReset, loadingSetState } from "./util"

export async function getInfo(url: string) {
    let modInfo
    const modInfoUrl = `${url.replace("github.com", "raw.githubusercontent.com")}/main/mod.json`

    try {
        modInfo = await (await axios.get(modInfoUrl)).data
    } catch (err) {
        throw new SoftError(`Could not find a valid mod at ${url} (${err})`)
    }

    if (!modInfo.name) {
        throw new SoftError("This mod does not provide a 'name' in its mod.json file, this is required!")
    }

    if (typeof modInfo.name !== "string") {
        throw new SoftError("Mod 'name' must be a string!")
    }

    if (modInfo.version && typeof modInfo.version !== "string") {
        throw new SoftError("Mod 'version' must be a string!")
    }

    modInfo.name = modInfo.name.toLowerCase()
    modInfo.version = modInfo.version || "0.0.1"
    modInfo.url = url

    return modInfo
}


export function isValidURL(url: string) {
    return url.startsWith("https://github.com")
}

export function get(name: string) {
    const conf = config.read()
    const i = conf.mods.findIndex((x: any) => x.name === name)

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
    return conf.mods.findIndex((x: any) => x.name === modName)
}

/** Installs a mod from a GitHub repository URL. */
export async function install(url: string) {
    // Get mod.json file info
    // get title, version, store in timm.json mods
    const mod = await getInfo(url)
    const modPath = path.resolve(appPath.modsDir, mod.name)
    const modTempFileName = `${mod.name}.zip`

    const modLoadStateId = `m_${mod.name}_install`
    loadingReset(modLoadStateId)

    // If mod is already installed prompt?

    log.info(`Installing ${mod.name} (${mod.version}):`)

    // Download archive
    log.info(`Downloading from ${mod.url}`)
    await files.downloadTempFile(`${mod.url}/archive/refs/heads/main.zip`, modTempFileName, modLoadStateId)

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

    // Append to timm.json the mod info
    const conf = config.read()

    const foundIndex = conf.mods.findIndex((x: any) => x.name === mod.name)

    // If mod exists replace otherwise append
    if (foundIndex === -1) {
        conf.mods.push(mod)
    } else {
        conf.mods[foundIndex] = mod
    }

    config.update(conf)

    const succMsg = `${mod.name} (${mod.version}) was installed succesfully!`
    log.info(succMsg)
    loadingSetState(modLoadStateId, succMsg, 1, 1)

    return mod
}

export async function mountMod(mod: any) {
    const modFolder = path.resolve(appPath.modsDir, mod.name)
    const modFs = jetpack.cwd(modFolder)
    const modContentsTemp = modFs.find(".", {directories: false, recursive: true})

    const modContents: any = {}
    for (const filePath of modContentsTemp) {
        modContents[path.normalize(filePath)] = mod.name
    }

    const mods = getAll()
    const manifest = game.getMountManifest()
    const manifestDiff: any = {}
    const claims: any = {}
    const myPriority = getLoadOrder(mod)
    let conf = config.read()

    for (const [k, v] of Object.entries(modContents)) {
        claims[k] = false

        // If the mounted file has conflict
        if (manifest[k]) {
            const ownerMod = mods[getIndex(conf, manifest[k])]

            if (ownerMod && ownerMod.name !== mod.name) {
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
    await (async () => {
        const [emitter, totalFiles] = game.mountContent(manifestDiff, modFolder, appPath.mountDir)
        // const progressBar = new ProgressBar("-> Mounting [:bar] (:curSize/:maxSize) :percent complete  (:etas seconds remaining)", {
        //     width: 44,
        //     complete: "=",
        //     incomplete: " ",
        //     renderThrottle: 1,
        //     total: totalFiles
        // })

        // emitter.on("progress", (totalCompleted) => progressBar.tick(1, {
        //     maxSize: totalFiles,
        //     curSize: totalCompleted
        // }))

        return new Promise<void>(function(resolve, reject) {
            emitter.once("end", () => resolve())
        })
    })()

    conf = config.read()
    const modIndex = getIndex(conf, mod.name)
    conf.mountManifest = manifest
    conf.mods[modIndex].mounted = true
    conf.mods[modIndex].claims = claims
    config.update(conf)
}

export async function unMountMod(mod: any) {
    const modFolder = path.resolve(appPath.modsDir, mod.name)
    const modFs = jetpack.cwd(modFolder)

    const manifest = game.getMountManifest()
    const content: any = {}

    for (const [k, v] of Object.entries(manifest)) {
        if (v === mod.name) {
            content[k] = v
        }
    }

    await game.unMountContent(content, modFolder, appPath.mountDir)

    // TODO: Fix this so it loops through a sorted array of claims to see
    for (const [k, v] of Object.entries(manifest)) {
        if (v === mod.name) {
            manifest[k] = undefined
        }
    }

    const conf = config.read()
    const modIndex = getIndex(config, mod.name)
    //config.mountManifest = manifest
    conf.mods[modIndex].mounted = false
    conf.mods[modIndex].claims = undefined
    config.update(conf)
}
