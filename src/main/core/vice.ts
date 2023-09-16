import {IceKey} from "node-ice"

const enc = new TextEncoder()
const VICE_TI_PKEY = "71B4Dt1Z"

function handleEncryption(data: string | Uint8Array, isDecrypting: boolean) {
    const buff = Buffer.from(data)

    const iceKey = new IceKey(0)
    iceKey.set(enc.encode(VICE_TI_PKEY))

    const chunkSize = 8
    let bytesLeft = data.length

    const chunkBuff = new Uint8Array(chunkSize)
    const finalOutBuff = new Uint8Array(bytesLeft)

    let curOffset = 0

    while (bytesLeft >= chunkSize) {
        if (isDecrypting) {
            iceKey.decrypt(buff.subarray(curOffset, curOffset + chunkSize), chunkBuff)
        } else {
            iceKey.encrypt(buff.subarray(curOffset, curOffset + chunkSize), chunkBuff)
        }

        finalOutBuff.set(chunkBuff, curOffset)
        curOffset += chunkSize
        bytesLeft -= chunkSize
    }

    // the end bit is not encrypted if it doesnt match with multiple of chunksize
    if (bytesLeft > 0) {
        finalOutBuff.set(buff.subarray(curOffset, curOffset + bytesLeft), curOffset)
    }

    return finalOutBuff
}

export function decrypt(data: Uint8Array) {
    return handleEncryption(data, true)
}

export function encrypt(script: string) {
    return handleEncryption(script, false)
}
