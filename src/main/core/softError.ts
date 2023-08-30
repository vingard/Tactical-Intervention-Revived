import log from "electron-log"

export class SoftError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "SoftError"
        log.error(message)

        Object.setPrototypeOf(this, SoftError.prototype)
    }
}
