import * as dns from "dns"
import { shell } from "electron"
import { getWindow } from "../main"

export function loadingSetState(key: string, message: string, completedItems: number = 0, totalItems: number = 0, success: boolean = false) {
    const win = getWindow()
    if (!win) return
    win.webContents.send("loading:setState", key, completedItems, totalItems, message, success)
}

export function loadingSetError(key: string, message: string) {
    const win = getWindow()!
    if (!win) return
    win.webContents.send("loading:setError", key, message)
}

export function loadingReset(key: string) {
    const win = getWindow()!
    if (!win) return
    win.webContents.send("loading:reset", key)
}

/**
 *
 * @param time Time in ms
 * @returns
 */
export function wait(time: number) {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise(resolve => setTimeout(resolve, time))
}

export function startExecutableWithArgs(filePath: string, args?: string) {
    const shortcutPath = `${filePath}.lnk`
    shell.writeShortcutLink(shortcutPath, "create", {
        target: filePath,
        args,
        description: "Don't delete - auto generated shortcut from Tactical Internvention Revived"
    })

    shell.openPath(shortcutPath)
}

export function isDev() {
    return process.env.NODE_ENV === "development"
}

export async function dnsLookup(host: string): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
        dns.lookup(host, (err, address, family) => {
            if (err) resolve(undefined)
            resolve(address)
        })
    })
}
