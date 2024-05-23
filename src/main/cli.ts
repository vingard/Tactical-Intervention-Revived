import log from "electron-log"

import * as server from "./core/server"
import * as game from "./core/game"

export function startServer(args: any) {
    if (!game.isInstalled) return log.warn("Tried to start server with CLI when game was not installed!")

    const port = args.serverPort || 27015
    const cfg = args.serverCfg

    log.info(`Starting server due to CLI arguments (serverCfg=${cfg}, serverPort=${port})...`)
    server.start(cfg && `exec ${cfg}`, port)
}
