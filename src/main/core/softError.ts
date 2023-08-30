import log from "electron-log"
import { loadingSetError } from "./util"

export class SoftError extends Error {
    constructor(message: string, loadStateId?: string) {
        super(message)
        this.name = "SoftError"
        log.error(message)

        if (loadStateId) loadingSetError(loadStateId, message)

        Object.setPrototypeOf(this, SoftError.prototype)
    }
}
