import {app} from "electron"
import path from "path"
// eslint-disable-next-line import/no-cycle
import * as files from "./files"
import { isDev } from "./util"

export const exePath = app.getPath("exe")
export const exeName =  path.basename(exePath)
export const workingDir = path.dirname(exePath)
export const binAssetPath = isDev() ? path.resolve(workingDir, "assets_bin") : workingDir
export const dsAssetPath = isDev() ? path.resolve(workingDir, "assets_ds") : workingDir
const appData = app.getPath("appData")

export const tacintDir = files.createDirIfNotExists(path.resolve(workingDir, "tacint"))
export const binDir = files.createDirIfNotExists(path.resolve(workingDir, "bin"))

export const gameExe = "tacint_mapkit.exe"
export const serverExe = "tacint_ds.exe"

export const configPath = path.resolve(workingDir, "_revived", "data.json")
export const cfgPath = path.resolve(tacintDir, "cfg", "revived.cfg")
export const gamePath = path.resolve(binDir, gameExe)
export const devToolsPath = path.resolve(binDir, "TacintMapkitLauncher.exe")
export const srcdsPath = path.resolve(binDir, serverExe)

export const commonRedistDir = files.createDirIfNotExists(path.resolve(workingDir, "_revived", "_CommonRedist"))
export const revivedDir = files.createDirIfNotExists(path.resolve(workingDir, "_revived"))
export const mountDir = files.createDirIfNotExists(path.resolve(workingDir, "tacint")) // used to be 'mapkit' changed to tacint due to mapkit compat issues
export const modsDir = files.createDirIfNotExists(path.resolve(workingDir, "mods"))
export const tempDir = files.createDirIfNotExists(path.resolve(workingDir, "_revived", "temp"))
export const baseContentDir = files.createDirIfNotExists(path.resolve(workingDir, "_revived", "base_content"))
export const backpackDir = files.createDirIfNotExists(path.resolve(appData, "Goldberg SteamEmu Saves", "51100", "remote"))
export const settingsDir = files.createDirIfNotExists(path.resolve(appData, "Goldberg SteamEmu Saves", "settings"))
export const cfgDir = path.resolve(tacintDir, "cfg")
export const mapsDir = path.resolve(tacintDir, "maps")
export const intermediateDir = files.createDirIfNotExists(path.resolve(revivedDir, "intermediate"))
