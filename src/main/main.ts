/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from "path"
import { app, BrowserWindow, shell, ipcMain, dialog } from "electron"
import { autoUpdater } from "electron-updater"
import log from "electron-log"
import { compareVersions } from "compare-versions"
//import { tcpPingPort } from "tcp-ping-port"
import MenuBuilder from "./menu"
import { resolveHtmlPath } from "./util"
import * as config from "./core/config"
import * as game from "./core/game"
import * as server from "./core/server"
import * as mod from "./core/mod"
import { loadingSetError } from "./core/util"
import { SoftError } from "./core/softError"
import { devToolsPath, modsDir } from "./core/appPath"
import { LOADOUTS } from "./loadout_data"
import { ProcessWatcher } from "./core/procwatch"

export class AppUpdater {
    constructor() {
        log.transports.file.level = "info"
        autoUpdater.logger = log
        autoUpdater.autoDownload = false

        autoUpdater.on("error", (error) => {
            dialog.showErrorBox("Error: ", error == null ? "unknown" : (error.stack || error).toString())
        })

        autoUpdater.on("update-available", async () => {
            // eslint-disable-next-line promise/catch-or-return
            const buttonPressed = await dialog.showMessageBox({
                type: "info",
                title: "Launcher Update Available",
                message: "A launcher update is available, do you want update now?",
                buttons: ["Update", "Cancel"]
            })

            if (buttonPressed.response === 0) autoUpdater.downloadUpdate()
        })

        // autoUpdater.on("update-not-available", () => {
        //     // bit of a nasty hack, to not show the dialog on first call
        //     // could be improved later probably
        //     displayUpdateNotif = true
        //     if (!displayUpdateNotif) return

        //     dialog.showMessageBox({
        //         title: "No Updates",
        //         message: "Current version is up-to-date."
        //     })
        // })

        autoUpdater.on("update-downloaded", () => {
            // eslint-disable-next-line promise/catch-or-return
            dialog.showMessageBox({
                title: "Update Ready For Install",
                message: "Update downloaded successfully, after you close this popup the launcher will shut-down to install the update..."
            }).then(() => {
                setImmediate(() => autoUpdater.quitAndInstall(false, true))
            })
        })

        AppUpdater.checkForUpdates(true)
    }

    static async checkForUpdates(silent: boolean = false) {
        const updateResult = await autoUpdater.checkForUpdates()
        if (!updateResult) return // for dev builds

        // If remote version is not greater than cur app ver and not silent mode then display message
        if (updateResult?.updateInfo?.version && compareVersions(updateResult?.updateInfo.version, app.getVersion()) !== 1 && !silent) {
            dialog.showMessageBox({
                title: "No Updates",
                message: "Current version is up-to-date."
            })
        }
    }
}

let mainWindow: BrowserWindow | null = null

ipcMain.on("ipc-example", async (event, arg) => {
    const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`
    console.log(msgTemplate(arg))
    event.reply("ipc-example", msgTemplate("pong"))
})

if (process.env.NODE_ENV === "production") {
    const sourceMapSupport = require("source-map-support")
    sourceMapSupport.install()
}

export const isDebug =
    process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true"

if (isDebug) {
    require("electron-debug")()
}

const installExtensions = async () => {
    const installer = require("electron-devtools-installer")
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS
    const extensions = ["REACT_DEVELOPER_TOOLS"]

    return installer
        .default(
            extensions.map((name) => installer[name]),
            forceDownload
        )
        .catch(console.log)
}

const createWindow = async () => {
    if (isDebug) {
        //await installExtensions()
        // TODO: FIXME broken right now
    }

    const RESOURCES_PATH = app.isPackaged
        ? path.join(process.resourcesPath, "assets")
        : path.join(__dirname, "../../assets")

    const getAssetPath = (...paths: string[]): string => {
        return path.join(RESOURCES_PATH, ...paths)
    }

    mainWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 728,
        minHeight: 520,
        minWidth: 580,
        icon: getAssetPath("icon.ico"),
        webPreferences: {
            preload: app.isPackaged
                ? path.join(__dirname, "preload.js")
                : path.join(__dirname, "../../.erb/dll/preload.js")
        }
    })

    mainWindow.loadURL(resolveHtmlPath("index.html"))

    mainWindow.on("ready-to-show", () => {
        if (!mainWindow) {
            throw new Error("\"mainWindow\" is not defined")
        }
        if (process.env.START_MINIMIZED) {
            mainWindow.minimize()
        } else {
            mainWindow.show()
        }
    })

    mainWindow.on("closed", () => {
        mainWindow = null
    })

    const menuBuilder = new MenuBuilder(mainWindow)
    menuBuilder.buildMenu()

    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url)
        return { action: "deny" }
    })

    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    new AppUpdater();
}

// Start the process watcher...
export const processWatcher = new ProcessWatcher()

/**
 * Add event listeners...
 */

app.on("window-all-closed", () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== "darwin") {
        app.quit()
    }
})

export function getWindow() {
    return mainWindow
}

async function handleGameCheckState() {
    try {
        return game.checkInstalledStatus()
    } catch(err: any) {
        config.create(true)
    }
}

async function handleGameStartInstall() {
    try {
        await game.installGame()
        return true
    } catch (err: any) {
        log.error(err.message)
        loadingSetError("game", err.message)
        return false
    }
}

async function handleSetStartConfig(event: any, data: any) {
    let cfg = ""
    cfg += data.goreEnabled && "ti_low_violence 0\n" || ""
    cfg += data.maxFps && `fps_max ${data.maxFps}\n` || ""

    await game.setCfg(cfg)
    await game.setUsername(data.username)

    // Try to find Steam and put the Steam shortcut in
    if (data.steamShortcut) {
        await game.createSteamShortcuts()
    }
}


async function handleQueryServer(event: any, ip: string, port: number) {
    try {
        const info = await server.query(ip, port)
        return info
    } catch(err) {
        return false
    }


    // OLD METHOD, this is left in incase server queries dont work reliably
    // return new Promise<void>(function(resolve: any) {
    //     tccp.ping({address: ip, port, attempts: 3, timeout: 2000}, function(err, data) {
    //         if (err) return resolve(false)
    //         //console.log(data)
    //         if (data.min === undefined) resolve(false)

    //         return resolve(true)
    //     })
    // })
}

async function handleConnectServer(event: any, addr: string, password?: string) {
    try {
        let args = `connect ${addr}`
        args += password && `\npassword "${password}"` || ""
        await game.start(args)
        return true
    } catch(err: any) {
        throw new SoftError(err.message)
    }
}

async function handleGameStart(event: any) {
    //try {
        await game.start()
        return true
    // } catch(err: any) {
    //     throw new SoftError(err.message)
    // }
}

async function handleGmeStartDevTools() {
    try {
        shell.openPath(devToolsPath)
        return true
    } catch(err: any) {
        throw new SoftError(err.message)
    }
}

async function handleGetSettings() {
    const settings: any = {}
    try {
        settings.username = await game.getUsername()
        settings.cfg = await game.getCfg()
    } catch(err: any) {
        throw new SoftError(err.message)
    }

    return settings
}

async function handleSetSettings(event: any, data: any) {
    try {
        await game.setUsername(data.username)
        await game.setCfg(data.cfg, "revived.cfg")
        return true
    } catch(err: any) {
        throw new SoftError(err.message)
    }

    return false
}

async function handleQueryMod(event: any, url: string) {
    try {
        return {mod: await mod.getInfo(url)}
    } catch(err: any) {
        return {error: err.message}
    }
}

async function handleInstallMod(event: any, url: string, mount: boolean = false) {
    let modUid

    try {
        const modInfo = await mod.getInfo(url)
        modUid = modInfo.uid
        const installedMod = await mod.install(url, mount)

        return {success: installedMod}
    } catch(err: any) {
        log.error(err.message)
        loadingSetError(`mod_${modUid}`, err.message)
        return {error: err.message}
    }
}

async function handleSetMounted(event: any, modUID: string, isMounted: boolean) {
    try {
        const modData = await mod.get(modUID)

        if (isMounted) {
            await mod.mountMod(modData)
        } else {
            await mod.unMountMod(modData)
        }

        return true
    } catch(err: any) {
        console.error("MountModCaughtError", err)
        log.error(err.message)
        loadingSetError(`mod_${modUID}`, err.message)
    }
}

async function handleModInit() {
    await mod.init()
    return true
}

async function handleModOpenRemoteURL(event: any, modUID: string) {
    try {
        const thisMod = mod.get(modUID)
        await shell.openExternal(thisMod.url)
    } catch(err: any) {
        console.error("OpenRemoteURLModError", err)
    }
}

async function handleModOpenDirectory(event: any, modUID: string) {
    try {
        const thisMod = mod.get(modUID)
        await shell.openPath(path.resolve(modsDir, modUID))
    } catch(err: any) {
        console.error("OpenDirectoryModError", err)
    }
}

async function handleModDelete(event: any, modUID: string) {
    try {
        const thisMod = mod.get(modUID)
        if (!thisMod) throw new Error(`Failed to find mod '${modUID}'`)
        await mod.remove(thisMod)
    } catch(err: any) {
        console.error("DeleteModError", err)
        log.error(err.message)
        loadingSetError(`mod_${modUID}`, err.message)
    }
}

async function handleGetLoadoutData() {
    return LOADOUTS
}

async function handleGetLoadout() {
    try {
        return await game.getBackpackAndLoadout()
    } catch(err: any) {
        log.error(err.message)
    }
}

async function handleSetLoadout(event: any, backpack: any, loadouts: any) {
    try {
        const conf = config.read()
        conf.backpack = backpack
        conf.loadouts = loadouts
        config.update(conf)
    } catch(err: any) {
        log.error(err.message)
    }
}

async function handleModNew(event: any, modInfo: any) {
    try {
        return await mod.createNew(modInfo.uid, modInfo.name, modInfo.description, modInfo.author, modInfo.version)
    } catch(err: any) {
        log.error(err.message)
    }
}

async function handleModSync(event: any, modUID: string) {
    try {
        const modData = await mod.get(modUID)
        await mod.sync(modData)

        return true
    } catch(err: any) {
        console.error("SyncModCaughtError", err)
        log.error(err.message)
        loadingSetError(`mod_${modUID}`, err.message)
    }
}

async function handleModSetPriority(event: any, modUID: string, priority: number) {
    try {
        const modData = await mod.get(modUID)
        await mod.setPriority(modData, priority)

        return true
    } catch(err: any) {
        console.error("SetPriorityModCaughtError", err)
        log.error(err.message)
        loadingSetError(`mod_${modUID}`, err.message)
    }
}

// todo: recode this to support loading bar in the future?
async function handleModInstallFromFolder(event: any) {
    try {
        const dirs: any = await dialog.showOpenDialog({properties: ["openDirectory"]})
        const modSourcePath = dirs?.filePaths?.[0]
        if (!modSourcePath) return

        const thisMod = await mod.installFromFolder(modSourcePath)

        const win = getWindow()!
        if (!win) return
        dialog.showMessageBox(win, {
            type: "info",
            title: "Mod Install Successful",
            message: `Succesfully installed ${thisMod.name || thisMod.uid} (${thisMod.version || "???"})`
        })
    } catch(err: any) {
        log.error(err.message)
        dialog.showErrorBox("Mod Install Failed", err.message)
    }
}

app.whenReady()
    .then(() => {
        ipcMain.handle("game:checkState", handleGameCheckState)
        ipcMain.handle("game:startInstall", handleGameStartInstall)
        ipcMain.handle("game:setStartConfig", handleSetStartConfig)
        ipcMain.handle("game:queryServer", handleQueryServer)
        ipcMain.handle("game:connectServer", handleConnectServer)
        ipcMain.handle("game:start", handleGameStart)
        ipcMain.handle("game:startDevTools", handleGmeStartDevTools)
        ipcMain.handle("game:getSettings", handleGetSettings)
        ipcMain.handle("game:setSettings", handleSetSettings)
        ipcMain.handle("game:getLoadoutData", handleGetLoadoutData)
        ipcMain.handle("game:getLoadout", handleGetLoadout)
        ipcMain.handle("game:setLoadout", handleSetLoadout)

        ipcMain.handle("mod:query", handleQueryMod)
        ipcMain.handle("mod:install", handleInstallMod)
        ipcMain.handle("mod:setMounted", handleSetMounted)
        ipcMain.handle("mod:init", handleModInit)
        ipcMain.handle("mod:openRemoteURL", handleModOpenRemoteURL)
        ipcMain.handle("mod:openDirectory", handleModOpenDirectory)
        ipcMain.handle("mod:delete", handleModDelete)
        ipcMain.handle("mod:new", handleModNew)
        ipcMain.handle("mod:sync", handleModSync)
        ipcMain.handle("mod:setPriority", handleModSetPriority)
        ipcMain.handle("mod:installFromFolder", handleModInstallFromFolder)

        config.create()

        app.on("activate", () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (mainWindow === null) createWindow()
        });

        (async () => {
            await createWindow()
            //mod.init() We do this through an IPC now
        })()
    })
    .catch(console.log)
