import log from "electron-log"
import srcdsQuery from "source-server-query"
import { spawn } from "child_process"

import * as util from "./util"
import * as appPath from "./appPath"
import * as game from "./game"
import * as mod from "./mod"
import * as masterServer from "./masterserver"
import { SoftError } from "./softError"


let LAST_SERVER_PORT: number
let LAST_SERVER_IS_HIDDEN: boolean

// this is a nasty hack
export function getLastServerPort() {
    return LAST_SERVER_PORT
}

export function getLastServerIsHidden() {
    return LAST_SERVER_IS_HIDDEN
}

export async function getDefaultServerName() {
    let username

    try { username = await game.getUsername() } catch { /** nothing */ }

    return `${username}'s server`
}

// eslint-disable-next-line default-param-last
export async function start(args: string = "", port: number = 27015, publicPort?: number, isHidden: boolean = false) {
    log.info(`Attempting to start dedicated server with args: ${args}`)

    const serverModObjects: any = {}

    for (const modObj of mod.getAll()) {
        if (!modObj.mounted || !modObj.url) continue

        serverModObjects[modObj.uid] = { url: modObj.url, version: modObj.version, require: modObj.requireClientDownload }
    }

    const conf = {mods: serverModObjects, loadoutRules: {}}

    let baseArgs = "sv_master_legacy_mode 1"
    baseArgs += "\nsv_enableoldqueries 1" // restore Source Server Queries
    baseArgs += "\nsv_use_steam_voice 0" // restore VOIP
    baseArgs += "\nsv_alltalk 2" // all teams can talk
    baseArgs += "\nsetinfo debug_disable_rounds 0" // stop annoying console spam
    baseArgs += "\nsv_hibernate_when_empty 0" // disable hibernate
    baseArgs += "\nstringtable_usedictionaries 0" // prevent map change crashes
    baseArgs += `\nhostname ${await getDefaultServerName()}`
    baseArgs += "\nmap mis_highway"

    baseArgs += "\necho Started Tactical Intervention Revived server!"
    //baseArgs += `\nmaxplayers ${27016}`

    try {
        baseArgs += `\nmp_teamlist '${JSON.stringify(conf)}'` // We store the config in the unused mp_teamlist cvar LMAO
    } catch(err) {
        throw new SoftError(`Failed to parse server config! - ${err}`)
    }

    // old temp cfg system is kinda useless now that we have
    // startExecutableWithArgs
    await game.setTempCfg(`${baseArgs}\n\n${args}`)

    //await game.setCfg(`${baseArgs}\n\n${args}`, "ds.cfg")
    const exposedPort = publicPort || port

    LAST_SERVER_PORT = exposedPort
    LAST_SERVER_IS_HIDDEN = isHidden
    util.startExecutableWithArgs(appPath.srcdsPath, `-port ${port} +clientport 27006`)
}

export async function startExperimentalStreamed() {
    start("rcon_password")

    const server = await srcdsQuery
    server.authenticate("")
}

export async function query(ip: string, port: number = 27015, getPlayers: boolean = true) {
    let queryResult: any

    const lookupResult = await util.dnsLookup(ip)
    console.log("dnsLookupResult", lookupResult)
    if (lookupResult) ip = lookupResult

    try {
        queryResult = {}
        // TODO: Fix sync cascade
        queryResult.info = await srcdsQuery.info(ip, port)
        queryResult.rules = await srcdsQuery.rules(ip, port)
        queryResult.players = await srcdsQuery.players(ip, port)
    } catch(ex) {
        return
    }

    for (const cvar of queryResult.rules || []) {
        if (cvar.name !== "mp_teamlist") continue
        console.log("teamlist", cvar.value)

        try {
            console.log("json parse", cvar.value)
            const json = cvar.value.substring(1, cvar.value.length - 1)
            queryResult.meta = JSON.parse(json)
            console.log("success")
        } catch(ex) { /* empty */ }

        break
    }
    console.log(queryResult.meta)

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

export async function getList() {
    // eslint-disable-next-line prefer-const
    let {servers, status} = await masterServer.getServerList()
    if (!servers) return {status}

    servers = servers.map(async (server: any) => {
        const queryResult = await query(server.ip, server.port, true)
        return {...server, ...{query: queryResult}}
    })
    servers = await Promise.all(servers)

    return {status, servers}
}
