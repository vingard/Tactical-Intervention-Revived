import { API } from "./api"

export async function getServerList() {
    const {data, status} = await API.get("server/list")

    if (data?.servers) {
        return {status, servers: <any[]>data.servers, msVersion: <number>data.msVersion}
    }

    return {status}
}

export async function sendHeartbeat(port: number = 27015) {
    console.log("heartbeat")
    const {data, status} = await API.post("server/heartbeat", {port})

    console.log(data)
    return {
        status,
        response: status === 200 && {
            updatedAt: data.updatedAt,
            expiresAt: data.expiresAt
        } || undefined
    }
}

export async function sendKillHeartbeat(port: number = 27015) {
    const {data, status} = await API.delete("server/heartbeat", {data: {port}})

    return {
        status,
        response: status === 200 && data
    }
}

// Maybe a method to check if IP+port is port-forwarded?
