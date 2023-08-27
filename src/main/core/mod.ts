import axios from "axios"
import path from "path"
import jetpack from "fs-jetpack"
import * as config from "./config"
import * as files from "./files"
// eslint-disable-next-line import/no-cycle
import * as game from "./game"
import * as appPath from "./appPath"

async function getInfo(url: string) {
    let modInfo
    const modInfoUrl = `${url.replace("github.com", "raw.githubusercontent.com")}/main/mod.json`

    try {
        modInfo = await (await axios.get(modInfoUrl)).data
    } catch (err) {
        throw new Error(`Could not find a valid mod at ${url} (${err})`)
    }

    if (!modInfo.name) {
        throw new Error("This mod does not provide a 'name' in its mod.json file, this is required!")
    }

    if (typeof modInfo.name !== "string") {
        throw new Error("Mod 'name' must be a string!")
    }

    if (modInfo.version && typeof modInfo.version !== "string") {
        throw new Error("Mod 'version' must be a string!")
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

export function getModIndex(conf: any, modName: string) {
    return conf.mods.findIndex((x: any) => x.name === modName)
}

/** Installs a mod from a GitHub repository URL. */
export async function install(url: string) {
    // Get mod.json file info
    // get title, version, store in timm.json mods
    const mod = await getInfo(url)
    const modPath = path.resolve(appPath.modsDir, mod.name)
    const modTempFileName = `${mod.name}.zip`

    // If mod is already installed prompt?

    console.log(`Installing ${mod.name} (${mod.version}):`)

    // Download archive
    console.log(`Downloading...`)
    await files.downloadTempFile(`${mod.url}/archive/refs/heads/main.zip`, modTempFileName)

    // Make mods folder and remove old install
    await files.tryToRemoveDirectory(modPath)
    await files.createDirIfNotExists(modPath)

    // Extract to mods folder
    console.log(`Extracting...`)
    await files.extractArchive(path.resolve(appPath.tempDir, modTempFileName), modPath)

    // Move all files up one directory and cleanup the mess
    await files.gitFileFix(modPath)

    // Remove mod info and git files from mod
    console.log("Finishing up...")
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

    //console.log(successColor(`${mod.name} (${mod.version}) was installed succesfully!`))

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
            const ownerMod = mods[getModIndex(conf, manifest[k])]

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
    const modIndex = getModIndex(conf, mod.name)
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
    const modIndex = getModIndex(config, mod.name)
    //config.mountManifest = manifest
    conf.mods[modIndex].mounted = false
    conf.mods[modIndex].claims = undefined
    config.update(conf)
}


export async function mountBaseContent() {
    const baseContentFs = jetpack.cwd(appPath.baseContentDir)
    const mountFs = jetpack.cwd(appPath.mountDir)
    const contentsTemp = baseContentFs.find(".", {directories: false, recursive: true})
    const contents: any = {}

    // const progressBarPrep = new ProgressBar("-> Preparing to mount [:bar] :percent complete  (:etas seconds remaining)", {
    //     width: 44,
    //     complete: "=",
    //     incomplete: " ",
    //     renderThrottle: 1,
    //     total: contentsTemp.length
    // })

    for (const filePath of contentsTemp) {
        if (mountFs.exists(filePath) !== "file") {
            contents[filePath] = "_BaseGameContent"
        }

        //progressBarPrep.tick(1)
    }

    const [emitter, totalFiles] = game.mountContent(contents, appPath.baseContentDir, appPath.mountDir)
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

    return new Promise<void>(function (resolve, reject) {
        emitter.once("end", () => resolve())
    })
}
