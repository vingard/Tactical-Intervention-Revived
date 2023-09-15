// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron"

export type Channels =
    | "game:checkState"
    | "game:setState"
    | "game:startInstall"
    | "game:setStartConfig"
    | "game:setCfg"
    | "game:getCfg"
    | "game:queryServer"
    | "game:connectServer"
    | "game:start"
    | "game:startDevTools"
    | "game:getSettings"
    | "game:setSettings"
    | "game:getLoadoutData"
    | "game:getLoadout"
    | "game:setLoadout"
    | "game:showUninstaller"
    | "loading:setState"
    | "loading:setError"
    | "loading:reset"
    | "loading:success"
    | "mod:query"
    | "mod:install"
    | "mod:setState"
    | "mod:setDeleted"
    | "mod:setMounted"
    | "mod:init"
    | "mod:openRemoteURL"
    | "mod:openDirectory"
    | "mod:delete"
    | "mod:setPriority"
    | "mod:installManual"
    | "mod:new"
    | "mod:update"
    | "mod:checkForUpdate"
    | "mod:sync"

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
