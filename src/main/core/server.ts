import log from "electron-log"
import { shell } from "electron"
import srcdsQuery from "source-server-query"

import * as appPath from "./appPath"
import * as game from "./game"
import { SoftError } from "./softError"

export async function start(args: string = "") {
    log.info(`Attempting to start dedicated server with args: ${args}`)
    const conf = {mods: {}, loadoutRules: {}, hidden: false}

    let baseArgs = "sv_master_legacy_mode 1"
    baseArgs += "\nsv_enableoldqueries 1"
    baseArgs += `\nhostname ${await game.getUsername()}'s server`

    try {
        baseArgs += `\nmp_teamlist '${JSON.stringify(conf)}'` // We store the config in the unused mp_teamlist cvar LMAO
    } catch(err) {
        throw new SoftError(`Failed to parse server config! - ${err}`)
    }

    await game.setTempCfg(`${baseArgs}\n\n${args}`)
    shell.openPath(`${appPath.srcdsPath}`)
}

export async function query(ip: string, port: number = 27015, getPlayers: boolean = true) {
    const queryResult: any = {}
    queryResult.info = await srcdsQuery.info(ip, port)
    if (getPlayers) queryResult.players = await srcdsQuery.players(ip, port)

    return queryResult
}

export async function getConfig(ip: string, port: number = 27015) {
    let rules
    let json

    try {
        rules = await srcdsQuery.rules(ip, port)
    } catch(err) {
        throw new SoftError(`Failed to query server rules for ${ip}:${port}`)
    }

    try {
        const i = rules.findIndex((x: any) => x.name === "mp_teamlist")
        json = rules[i].value
    } catch(err) {
        throw new SoftError(`Error decoding server config query ${err}`)
    }

    try {
        return JSON.parse(json)
    } catch(err) {
        throw new SoftError(`Failed to parse server config for ${ip}:${port}`)
    }
}
