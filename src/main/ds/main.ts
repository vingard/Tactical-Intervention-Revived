/* eslint-disable no-await-in-loop */
import { Command, program } from "commander";
import { app } from "electron";
import { hideBin } from "yargs/helpers";
import jetpack from "fs-jetpack";
import path from "path";
import log from "electron-log"
import { z } from "zod"
import YAML from "yaml"
import * as readline from "readline"
import { processWatcher } from "../main"

import * as server from "../core/server"
import * as game from "../core/game"
import * as mod from  "../core/mod"
import { dsAssetPath } from "../core/appPath"
import { prettyZodError } from "../core/util"

interface ServerConfigMod {
    url: string
    requireClientDownload: boolean
}

interface ServerConfig {
    port: number
    public: boolean
    hostname: string
    publicPort?: number
    cfg?: string
    autoRestart: boolean
    autoUpdateMods: boolean
    mods: ServerConfigMod[]
}

const MOD_SCHEMA = z.object({
    url: z.string({message: "must be a string"}).url({message: "must be a url"}),
    requireClientDownload: z.boolean({message: "must be a boolean"})
}).strict()

const REVIVED_SERVER_YML_SCHEMA = z.object({
    port: z.number({message: "must be a number"}).int({message: "must be an integer"}).positive({message: "must be positive"}),
    public: z.boolean({message: "must be a boolean"}),
    hostname: z.string({message: "must be a string"}),
    publicPort: z.number({message: "must be a number" }).int({message: "must be a integer"}).positive({message: "must be positive"}).optional(),
    hostToken: z.string().optional(),
    cfg: z.string({message: "must be a string"}).optional(),
    autoRestart: z.boolean({message: "must be boolean"}).optional().default(true),
    autoUpdateMods: z.boolean({message: "must be a boolean"}).optional().default(true),
    mods: z.array(MOD_SCHEMA, {message: "must be an array"}).optional().default([])
}).strict()


function setupConfig(configFile: string = "revived_server.yml"): ServerConfig {
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

async function setupGame() {
    // make sure game is installed
    if (!game.isInstalled()) {
        console.log("This server does not have an active install of Tactical Intervention... installing:")

        try {
            await game.installGame()
        } catch (err: any) {
            return program.error(`Error installing game: ${err.message}`)
        }
    }
}

async function setupMods(conf: ServerConfig) {
    console.log(`This server is using ${conf.mods.length} mods`)

    const installedModIndex: any = {}

    for (let modObj of mod.getAll()) {
        // remove any mods not in config
        if (!conf.mods.find((cMod) => cMod.url === modObj.url)) {
            try {
                log.info(`Removing non-required mod ${modObj.uid}...`)
                console.log("")
                await mod.remove(modObj)
            } catch(err: any) { log.error(`Error removing mod - ${err.message}`) }
            continue
        }

        installedModIndex[modObj.url as string] = true

        console.log("Checking for mod updates...")
        console.log("")

        try {
            if (conf.autoUpdateMods || program.getOptionValue("allowUpdates")) {
                const result = await mod.checkForUpdates(modObj, false)
                if (result.available) {
                    log.info(`Updating ${modObj.uid} to version ${result.version}...`)
                    console.log("")
                    modObj = await mod.update(modObj)
                }
            }

            // mount all mods
            if (!modObj.mounted) {
                log.info(`${modObj.uid} was not mounted - mounting...`)
                console.log("")
                modObj = await mod.mountMod(modObj)
            }
        } catch(err: any) {
            log.error(`Error checking/installing update for mod '${modObj.uid}': ${err.message}`)
        }
    }

    for (const thisMod of conf.mods) {
        // get any mods we dont have already
        let modObj = installedModIndex[thisMod.url]
        if (!modObj) modObj = await mod.install(thisMod.url, true)

        await mod.setRequireClientDownload(modObj, thisMod.requireClientDownload)
    }

    console.log("Mod setup complete!")
}

const shutdown = () => {
    app.quit()
    process.exit(0)
}

// hacky fix for windows sigint stuff
if (process.platform === "win32") {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    rl.on("SIGINT", () => process.emit("SIGINT"))
}

export async function serverInit() {
    process.on("SIGINT", () => shutdown()) // shut down properly when CTRL+C'd
    process.on("SIGQUIT", () => shutdown())
    process.on("SIGTERM", () => shutdown())

    program
        .option("-c --config <string>", "The revived server .yml configuration file", "revived_server.yml")
        .option("-u --allowUpdates", "Should we allow the updating of mods, inherits from the config by default")

    program.parse(hideBin(process.argv))

    const allOptions: any = {}

    for (const opt of program.options) {
        allOptions[opt.name()] = program.getOptionValue(opt.name())
    }

    const conf = setupConfig(program.getOptionValue("config"))

    console.log("Tactical Intervention Revived Dedicated Server (TIRDS)")
    console.log("[!] For any mounting, installing or updating this executable must be ran with administrator permissions! ")

    await setupGame()
    await setupMods(conf)

    const publicPort = conf.publicPort || conf.port

    console.log(`\nTactical Intervention Revived Dedicated Server (${app.getVersion()}) started on port ${conf.port}`)
    console.log(`Total Mods: ${conf.mods.length} | Config: ${conf.cfg} | Is Public: ${conf.public} | Public Port: ${conf.publicPort}`)
    console.log("-----------------------------------------------------------------\n")

    //server.startExperimentalStreamed()
    const startConfig = `hostname ${conf.hostname}
    ti_vehicle_authmode 1
    \n\n${conf.cfg}`

    const startServer = () => server.start(startConfig, conf.port, publicPort, !conf.public)

    await startServer()

    processWatcher.on("serverClosed", async () => {
        if (!conf.autoRestart) return
        log.warn("Server detected as crashed - restarting!")
        await startServer()
    })
}
