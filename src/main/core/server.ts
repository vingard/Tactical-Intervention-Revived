import log from "electron-log"
import srcdsQuery from "source-server-query"

import * as util from "./util"
import * as appPath from "./appPath"
import * as game from "./game"
import { SoftError } from "./softError"

export async function start(args: string = "", port: number = 27015) {
    log.info(`Attempting to start dedicated server with args: ${args}`)
    const conf = {mods: {}, loadoutRules: {}, hidden: false}

    let baseArgs = "sv_master_legacy_mode 1"
    baseArgs += "\nsv_enableoldqueries 1" // restore Source Server Queries
    baseArgs += "\nsv_use_steam_voice 0" // restore VOIP
    baseArgs += "\nsv_alltalk 2" // all teams can talk
    baseArgs += `\nhostname ${await game.getUsername()}'s server`
    //baseArgs += `\nmaxplayers ${27016}`

    try {
        baseArgs += `\nmp_teamlist '${JSON.stringify(conf)}'` // We store the config in the unused mp_teamlist cvar LMAO
    } catch(err) {
        throw new SoftError(`Failed to parse server config! - ${err}`)
    }

    // old temp cfg system is kinda useless now that we have
    // startExecutableWithArgs
    //await game.setTempCfg(`${baseArgs}\n\n${args}`)

    await game.setCfg(`${baseArgs}\n\n${args}`, "ds.cfg")
    util.startExecutableWithArgs(appPath.srcdsPath, `+port ${port} +exec ds.cfg`)
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
