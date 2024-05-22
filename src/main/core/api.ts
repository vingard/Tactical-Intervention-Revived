import axios from "axios"
import https from "https"

export const API = axios.create({
    baseURL: "https://ti-revived-ms1.2i.games", // TODO: Make this configurable via env
    httpsAgent: new https.Agent({family: 4}), // use ipv4
    timeout: 4000
})
