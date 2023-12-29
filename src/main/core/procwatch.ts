import {psList} from "@heyikang/ps-list"
import path from "path"
import { EventEmitter } from "stream"
import * as appPath from "./appPath"
import {wait} from "./util"

const SCAN_DELAY = 1000

interface TrackedProcesses {
    game: Map<number, string>
    server: Map<number, string>
}


export class ProcessWatcher extends EventEmitter {
    private processes: TrackedProcesses = {
        game: new Map(),
        server: new Map()
    }

    private scanning: boolean = true

    constructor() {
        super()
        this.scanLoop()
    }

    // eslint-disable-next-line class-methods-use-this
    async scanLoop() {
        if (this.scanning) await this.scan()
        await wait(SCAN_DELAY)
        this.scanLoop()
    }

    async scan() {
        //console.log("binAssetPath", appPath.binAssetPath)

        const oldGameProcCount = this.processes.game.size
        const oldServerProcCount = this.processes.server.size

        const osProcesses = await psList({
            all: true,
            pslistIa32Path: path.resolve(appPath.binAssetPath, "fastlist-0.3.0-x86.exe"),
            pslistX64Path: path.resolve(appPath.binAssetPath, "fastlist-0.3.0-x64.exe")
        })

        this.processes.game.clear()
        this.processes.server.clear()

        for (const process of osProcesses) {
            if (process.name === appPath.gameExe) {
                this.processes.game.set(process.pid, process.name)
                continue
            }

            if (process.name === appPath.serverExe) {
                this.processes.server.set(process.pid, process.name)
                continue
            }
        }

        const newGameProcCount = this.processes.game.size

        //console.log(this.processes)

        // i could xor here but might wanna expand this tracking to be smarter in future
        if (oldGameProcCount === 0 && newGameProcCount > 0) this.emit("gameStarted")
        if (oldGameProcCount > 1 && newGameProcCount === 0) this.emit("gameClosed")
        if (oldServerProcCount === 0 && newGameProcCount > 0) this.emit("serverStarted")
        if (oldGameProcCount > 1 && newGameProcCount === 0) this.emit("serverClosed")
    }

    setScanning(isScanning: boolean) {
        this.scanning = isScanning
    }

    getScanning() {
        return this.scanning
    }

    getTrackedProcesses() {
        return this.processes
    }

    isGameOpen() {
        return this.getTrackedProcesses().game.size > 0
    }

    isServerOpen() {
        return this.getTrackedProcesses().server.size > 0
    }
}
