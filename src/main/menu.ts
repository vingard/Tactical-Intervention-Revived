import {
    app,
    Menu,
    shell,
    BrowserWindow,
    MenuItemConstructorOptions,
    dialog
} from "electron"

import * as appPath from "./core/appPath"
import * as server from "./core/server"
import * as game from "./core/game"

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
    selector?: string;
    submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
    mainWindow: BrowserWindow

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow
    }

    buildMenu(): Menu {
        if (
            process.env.NODE_ENV === "development" ||
            process.env.DEBUG_PROD === "true"
        ) {
            this.setupDevelopmentEnvironment()
        }

        const template = this.buildDefaultTemplate()

        const menu = Menu.buildFromTemplate(template)
        Menu.setApplicationMenu(menu)

        return menu
    }

    setupDevelopmentEnvironment(): void {
        this.mainWindow.webContents.on("context-menu", (_, props) => {
            const { x, y } = props

            Menu.buildFromTemplate([
                {
                    label: "Inspect element",
                    click: () => {
                        this.mainWindow.webContents.inspectElement(x, y)
                    }
                }
            ]).popup({ window: this.mainWindow })
        })
    }

    buildDefaultTemplate() {
        const isDebug = process.env.NODE_ENV === "development" || process.env.DEBUG_PROD === "true"
        const templateHelp = [
            {
                label: "Help",
                submenu: [
                    {
                        label: "Discord",
                        click() {
                            shell.openExternal("https://electronjs.org")
                        }
                    },
                    {
                        label: "GitHub Repository",
                        click() {
                            shell.openExternal(
                                "https://github.com/vingard/Tactical-Intervention-Revived"
                            )
                        }
                    },
                    {
                        label: "Making a Mod",
                        click() {
                            shell.openExternal(
                                "https://github.com/vingard/Tactical-Intervention-Revived/wiki"
                            )
                        }
                    },
                    {
                        label: `Version`,
                        sublabel: isDebug && "dev" || app.getVersion()
                    }
                ]
            }
        ]

        const templateDebug = [
            {
                label: "Debug",
                submenu: [
                    {
                        label: "&Reload",
                        accelerator: "Ctrl+R",
                        click: () => {
                            this.mainWindow.webContents.reload()
                        }
                    },
                    {
                        label: "Toggle &Full Screen",
                        accelerator: "F11",
                        click: () => {
                            this.mainWindow.setFullScreen(
                                !this.mainWindow.isFullScreen()
                            )
                        }
                    },
                    {
                        label: "Toggle &Developer Tools",
                        accelerator: "Alt+Ctrl+I",
                        click: () => {
                            this.mainWindow.webContents.toggleDevTools()
                        }
                    }
                ]
            }
        ]

        const templateMods = [
            {
                label: "Mods",
                submenu: [
                    {
                        label: "Check all mods for updates"
                    },
                    {
                        label: "Install mod from .zip"
                    },
                    {
                        label: "Create new mod..."
                    }
                ]
            }
        ]

        const templateGame = [
            {
                label: "Game",
                submenu: [
                    {
                        label: "Open Game Directory",
                        click: () => {
                            shell.openPath(appPath.workingDir)
                        }
                    },
                    {
                        label: "Start Dedicated Server",
                        click: () => {
                            if (!game.isInstalled()) return

                            server.start()
                        }
                    },
                    // {
                    //     label: "Re-Mount Game",
                    //     click: () => {

                    //     }
                    // },
                    {
                        label: "Uninstall Game",
                        click: async () => {
                            if (!game.isInstalled()) return

                            const buttonPressed = await dialog.showMessageBox(this.mainWindow, {
                                type: "warning",
                                title: "Are you sure you want to uninstall the game?",
                                message: "Uninstalling the game will delete your base game content. Your mods will be un-mounted, but not deleted. Loadouts will be preserved.",
                                buttons: [
                                    "Uninstall Game",
                                    "Cancel"
                                ]
                            })

                            if (buttonPressed.response === 0) {
                                await game.unInstall()
                            }
                        }
                    }
                ]
            }
        ]

        return [
            ...templateGame,
            ...templateMods,
            ...(isDebug ? templateDebug : []),
            ...templateHelp
        ]
    }
}
