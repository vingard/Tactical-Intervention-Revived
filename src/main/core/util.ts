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
