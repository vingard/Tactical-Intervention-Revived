import * as dns from "dns"
import * as readline from "readline"
import { app, shell } from "electron"
import { ZodError } from "zod"
import { getWindow } from "../main"
import { exeName } from "./appPath"

export function loadingSetState(key: string, message: string, completedItems: number = 0, totalItems: number = 0, success: boolean = false) {
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0)
    process.stdout.write(`${message} (${totalItems}/${completedItems})`)

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

export function isDedicatedServerBuild() {
    if (process.env.DEV_TACINTREV_IS_DS === "true") return true // special env var for dev builds

    return exeName === "ti_revived_server.exe"
}

export function prettyZodError(zodError: ZodError) {
    let errOut = ""

    for (const issue of zodError.errors) {
        const postFix = (issue.code === "invalid_type") &&`expected ${issue.expected}, got ${issue.received}` || issue.message
        errOut += `[${issue.path.join(".")}] ${issue.code}: ${postFix}\n`
    }

    return errOut
}
