import { getWindow } from "main/main"

export function setLoadingState(key: string, completedItems: number, totalItems: number, message: string) {
    const win = getWindow()!
    win.webContents.send("loading:setState", key, completedItems, totalItems, message)
}
