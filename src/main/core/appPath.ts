import {app} from "electron"
import path from "path"
// eslint-disable-next-line import/no-cycle
import * as files from "./files"

export const workingDir = path.dirname(app.getPath("exe"))

export const tacintDir = files.createDirIfNotExists(path.resolve(workingDir, "tacint")).toString()
export const binDir = files.createDirIfNotExists(path.resolve(workingDir, "bin")).toString()

export const commonRedistDir = files.createDirIfNotExists(path.resolve(workingDir, "_revived", "_CommonRedist")).toString()
export const revivedDir = files.createDirIfNotExists(path.resolve(workingDir, "_revived")).toString()
export const configPath = path.resolve(workingDir, "_revived", "data.json").toString()
export const mountDir = files.createDirIfNotExists(path.resolve(workingDir, "mapkit")).toString()
export const modsDir = files.createDirIfNotExists(path.resolve(workingDir, "mods")).toString()
export const tempDir = files.createDirIfNotExists(path.resolve(workingDir, "_revived", "temp")).toString()
export const baseContentDir = files.createDirIfNotExists(path.resolve(workingDir, "_revived", "base_content")).toString()
