import fs from "fs"
import * as appPath from "./appPath"
import { SoftError } from "./softError"

const CONFIG_DEFAULT = {
    gameDownloaded: false,
    mods: [],
    backpack: {},
    loadouts: []
}

export function update(config: any) {
    let configFile

    try {
        configFile = fs.writeFileSync(appPath.configPath, JSON.stringify(config, undefined, "  "))
        return true
    } catch (err) {
        throw new SoftError(`Error writing to the config file (${err})`)
    }
}

export function create(overwrite: boolean = false) {
    if (!fs.existsSync(appPath.configPath) || overwrite) {
        return update(CONFIG_DEFAULT)
    }

    return false
}

export function read() {
    let configFile

    try {
        configFile = fs.readFileSync(appPath.configPath)
    } catch (err) {
        throw new SoftError(`Error reading the config file (${err})`)
    }

    try {
        return JSON.parse(configFile.toString())
    } catch (err) {
        throw new SoftError(`Error parsing the config file (${err})`)
    }
}
