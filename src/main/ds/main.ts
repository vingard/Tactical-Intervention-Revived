import { program } from "commander";
import { app } from "electron";
import { hideBin } from "yargs/helpers";
import jetpack from "fs-jetpack";
import path from "path";
import log from "electron-log"
import { z } from "zod"
import YAML from "yaml"

import * as server from "../core/server"
import * as game from "../core/game"
import { dsAssetPath } from "../core/appPath"
import { prettyZodError } from "../core/util";

const MOD_SCHEMA = z.object({
    url: z.string({message: "must be a string"}).url({message: "must be a url"}),
    requireClientDownload: z.boolean({message: "must be a boolean"})
}).strict()

const REVIVED_SERVER_YML_SCHEMA = z.object({
    port: z.number({message: "must be a number"}).int({message: "must be an integer"}).positive({message: "must be positive"}),
    public: z.boolean({message: "must be a boolean"}),
    publicPort: z.number({message: "must be a number" }).int({message: "must be a integer"}).positive({message: "must be positive"}).optional(),
    cfg: z.string({message: "must be a string"}).endsWith(".cfg", {message: "must end with .cfg"}).optional(),
    autoRestart: z.boolean({message: "must be boolean"}).optional(),
    autoUpdateMods: z.boolean({message: "must be a boolean"}).optional(),
    mods: z.array(MOD_SCHEMA, {message: "must be an array"}).optional()
}).strict()

function setupConfig(configFile: string = "revived_server.yml") {
    const confPath = path.resolve(dsAssetPath, configFile)
    if (jetpack.exists(confPath) !== "file") return program.error(`'${confPath}' does not exist`)

    let conf

    try {
        const confContent = jetpack.read(confPath, "utf8")
        conf = YAML.parse(confContent as string, { strict: false })
    } catch(err: any) {
        return program.error(`Failed to read server config '${confPath}'\n${err.message}`)
    }

    const result = REVIVED_SERVER_YML_SCHEMA.safeParse(conf)

    if (result.error) return program.error(`Failed to validate server config '${confPath}'\nDetails:\n${prettyZodError(result.error)}`)

    return conf
}

export async function serverInit() {
    program.parse(hideBin(process.argv))

    if (!game.isInstalled) return log.warn("Tried to start dedicated server when game was not installed!")

    const allOptions: any = {}

    for (const opt of program.options) {
        allOptions[opt.name()] = program.getOptionValue(opt.name())
    }

    const conf = setupConfig()
    console.log(conf)

    console.log(`Tactical Intervention Revived Dedicated Server (${app.getVersion()}) started on port ${program.getOptionValue("port")}`)

    //server.startExperimentalStreamed()
    server.start()
}
