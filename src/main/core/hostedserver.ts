import log from "electron-log"
import * as masterServer from "./masterserver"

export class HostedServer {
    public alive: boolean = true

    public port: number

    public ip: string

    private rateLimitedCount = 0

    constructor(ip: string, port: number = 27015) {
        this.ip = ip
        this.port = port
        this.heartbeat()
    }

    async kill() {
        this.alive = false
        const x = await masterServer.sendKillHeartbeat(this.port)
        console.log(x)
    }

    private async heartbeat() {
        const {status, response} = await masterServer.sendHeartbeat(this.port)
        let delay = 50

        if (status === 429) {
            // too many requests error, let's try again in 30 seconds
            delay = 25 + (this.rateLimitedCount * 10)
            this.rateLimitedCount++
        } else {
            this.rateLimitedCount = 0
        }

        if (response) {
            console.log(response)
            const timeLeft = response.expiresAt - (Date.now() / 1000) // get time left in seconds
            console.log("timeLeft", timeLeft)
            delay = Math.max(timeLeft - 8, 0) // send our message 8 seconds early to give us some extra time
        } else {
            log.error(`No server heartbeat response, status $${status}`)
        }

        console.log("delay", delay)
        setTimeout(() => {
            if (this.alive) this.heartbeat()
        }, delay * 1000)
    }
}
