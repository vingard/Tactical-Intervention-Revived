import {app} from "electron"
import path from "path"
// eslint-disable-next-line import/no-cycle
import * as files from "./files"

export const exePath = app.getPath("exe")
export const workingDir = path.dirname(exePath)
const appData = app.getPath("appData")

export const tacintDir = files.createDirIfNotExists(path.resolve(workingDir, "tacint"))
export const binDir = files.createDirIfNotExists(path.resolve(workingDir, "bin"))

export const commonRedistDir = files.createDirIfNotExists(path.resolve(workingDir, "_revived", "_CommonRedist"))
export const revivedDir = files.createDirIfNotExists(path.resolve(workingDir, "_revived"))
export const configPath = path.resolve(workingDir, "_revived", "data.json")
export const cfgPath = path.resolve(tacintDir, "cfg", "revived.cfg")
export const mountDir = files.createDirIfNotExists(path.resolve(workingDir, "mapkit"))
export const modsDir = files.createDirIfNotExists(path.resolve(workingDir, "mods"))
export const tempDir = files.createDirIfNotExists(path.resolve(workingDir, "_revived", "temp"))
export const baseContentDir = files.createDirIfNotExists(path.resolve(workingDir, "_revived", "base_content"))
export const backpackDir = files.createDirIfNotExists(path.resolve(appData, "Goldberg SteamEmu Saves", "51100", "remote"))
export const settingsDir = files.createDirIfNotExists(path.resolve(appData, "Goldberg SteamEmu Saves", "settings"))
