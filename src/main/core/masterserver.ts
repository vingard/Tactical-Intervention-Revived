import { API } from "./api"

export async function getServerList() {
    let resp: any
    let error: any

    try {
        resp = await API.get("server/list")
    } catch (err) {
        error = err
    }

    const data = resp?.data
    const status = resp?.status || error?.response?.status

    if (data?.servers) {
        return {status, servers: <any[]>data.servers, msVersion: <number>data.msVersion}
    }

    return {status}
}

export async function sendHeartbeat(port: number = 27015) {
    let resp: any
    let error: any

    try {
        resp = await API.post("server/heartbeat", {port})
    } catch (err) {
        error = err
    }

    const data = resp?.data
    const status = resp?.status || error?.response?.status

    return {
        status,
        response: status === 200 && {
            updatedAt: data.updatedAt,
            expiresAt: data.expiresAt
        } || undefined
    }
}

export async function sendKillHeartbeat(port: number = 27015) {
    let resp: any
    let error: any

    try {
        resp = await API.delete("server/heartbeat", {data: {port}})
    } catch (err) {
        error = err
    }

    const data = resp?.data
    const status = resp?.status || error?.response?.status

    return {
        status,
        response: data
    }
}

// Maybe a method to check if IP+port is port-forwarded?
