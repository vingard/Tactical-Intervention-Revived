import { program } from "commander";
import { app } from "electron";
import { hideBin } from "yargs/helpers";
import log from "electron-log"

import * as server from "../core/server"
import * as game from "../core/game"


export async function serverInit() {
    program
        .requiredOption("-p, --port <number>", "Port to host the server on", (x) => parseInt(x, 10), 27015)

    program.parse(hideBin(process.argv))

    if (!game.isInstalled) return log.warn("Tried to start dedicated server when game was not installed!")

    const allOptions: any = {}

    for (const opt of program.options) {
        allOptions[opt.name()] = program.getOptionValue(opt.name())
    }

    //console.table(allOptions)

    console.log(`Tactical Intervention Revived Dedicated Server (${app.getVersion()}) started on port ${program.getOptionValue("port")}`)

    //server.startExperimentalStreamed()
    server.start()
}
