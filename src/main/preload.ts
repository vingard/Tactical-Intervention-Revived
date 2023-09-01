// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron"

export type Channels =
    | "game:checkState"
    | "game:startInstall"
    | "game:setStartConfig"
    | "game:setCfg"
    | "game:getCfg"
    | "game:queryServer"
    | "game:connectServer"
    | "game:start"
    | "game:getSettings"
    | "game:setSettings"
    | "loading:setState"
    | "loading:setError"
    | "loading:reset"
    | "mod:query"
    | "mod:install"

const electronHandler = {
    ipcRenderer: {
        sendMessage(channel: Channels, ...args: unknown[]) {
            ipcRenderer.send(channel, ...args)
        },
        on(channel: Channels, func: (...args: unknown[]) => void) {
            const subscription = (
                _event: IpcRendererEvent,
                ...args: unknown[]
            ) => func(...args)
            ipcRenderer.on(channel, subscription)

            return () => {
                ipcRenderer.removeListener(channel, subscription)
            }
        },
        once(channel: Channels, func: (...args: unknown[]) => void) {
            ipcRenderer.once(channel, (_event, ...args) => func(...args))
        },
        async invoke(channel: Channels, ...args: unknown[]) {
            return ipcRenderer.invoke(channel, ...args)
        }
    }
}

contextBridge.exposeInMainWorld("electron", electronHandler)

export type ElectronHandler = typeof electronHandler
