import {
    app,
    Menu,
    shell,
    BrowserWindow,
    MenuItemConstructorOptions
} from "electron"

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
        const templateDefault = [
            {
                label: "&View",
                submenu:
                    process.env.NODE_ENV === "development" ||
                    process.env.DEBUG_PROD === "true"
                        ? [
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
                          ] : []
            },
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
                                "https://github.com/electron/electron/tree/main/docs#readme"
                            )
                        }
                    },
                    {
                        label: "Making a Mod",
                        click() {
                            shell.openExternal(
                                "https://github.com/electron/electron/tree/main/docs#readme"
                            )
                        }
                    }
                ]
            }
        ]

        return templateDefault
    }
}
