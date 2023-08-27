import fs from "fs"
import * as appPath from "./appPath"

const CONFIG_DEFAULT = {
    gameDownloaded: false,
    mods: []
}

export function update(config: any) {
    let configFile

    try {
        configFile = fs.writeFileSync(appPath.configPath, JSON.stringify(config, undefined, "  "))
        return true
    } catch (err) {
        throw new Error(`Error writing to the config file (${err})`)
    }
}

export function create() {
    if (!fs.existsSync(appPath.configPath)) {
        return update(CONFIG_DEFAULT)
    }

    return false
}

export function read() {
    let configFile

    try {
        configFile = fs.readFileSync(appPath.configPath)
    } catch (err) {
        throw new Error(`Error reading the config file (${err})`)
    }

    try {
        return JSON.parse(configFile.toString())
    } catch (err) {
        throw new Error(`Error parsing the config file (${err})`)
    }
}
