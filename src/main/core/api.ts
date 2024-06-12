import axios from "axios"
import https from "https"

console.log("TIREVIVED_MS_HOST=", process.env.TIREVIVED_MS_HOST)

export const API = axios.create({
    baseURL: process.env.TIREVIVED_MS_HOST || "https://ti-revived-ms1.2i.games", // TODO: Make this configurable via env
    httpsAgent: new https.Agent({family: 4}), // use ipv4
    timeout: 4000
})
