/* eslint import/prefer-default-export: off */
import { URL } from "url"
import path from "path"
import { app } from "electron"

export function resolveHtmlPath(htmlFileName: string) {
    if (process.env.NODE_ENV === "development") {
        const port = process.env.PORT || 1212
        const url = new URL(`http://localhost:${port}`)
        url.pathname = htmlFileName
        return url.href
    }
    return `file://${path.resolve(__dirname, "../renderer/", htmlFileName)}`
}

export function isDedicatedServerBuild() {
    if (process.env.DEV_TACINTREV_IS_DS === "true") return true // special env var for dev builds
    return app.getName() === "ti_revived_server"
}
