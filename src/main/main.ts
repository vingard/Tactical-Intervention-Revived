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
import { app, BrowserWindow, shell, ipcMain } from "electron"
import { autoUpdater } from "electron-updater"
import log from "electron-log"
import tccp from "tcp-ping"
//import { tcpPingPort } from "tcp-ping-port"
import MenuBuilder from "./menu"
import { resolveHtmlPath } from "./util"
import * as config from "./core/config"
import * as game from "./core/game"
import * as server from "./core/server"
import * as mod from "./core/mod"
import { loadingSetError } from "./core/util"
import { SoftError } from "./core/softError"

class AppUpdater {
    constructor() {
        log.transports.file.level = "info"
        autoUpdater.logger = log
        autoUpdater.checkForUpdatesAndNotify()
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
        return game.checkInstalled()
    } catch(err: any) {
        config.create(true)
    }
}

async function handleGameStartInstall() {
    try {
        await game.installGame()
        return true
    } catch (err: any) {
        console.error("InstallGameCaughtError", err)
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

    return false
}

async function handleGameStart(event: any) {
    try {
        await game.start()
        return true
    } catch(err: any) {
        throw new SoftError(err.message)
    }

    return false
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
        return await mod.getInfo(url)
    } catch(err) {
        console.log(err)
    }
}

async function handleInstallMod(event: any, url: string, mount: boolean = false) {
    try {
        return await mod.install(url)
    } catch(err) {
        console.log(err)
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
        ipcMain.handle("game:getSettings", handleGetSettings)
        ipcMain.handle("game:setSettings", handleSetSettings)
        ipcMain.handle("mod:query", handleQueryMod)
        ipcMain.handle("mod:install", handleInstallMod)

        config.create()

        createWindow()
        app.on("activate", () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (mainWindow === null) createWindow()
        })
    })
    .catch(console.log)
