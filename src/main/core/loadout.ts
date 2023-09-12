import {Parser} from "binary-parser-encoder"
import path from "path"
import jetpack from "fs-jetpack"
import log from "electron-log"

import {LOADOUTS} from "../loadout_data"
import * as appPath from "./appPath"

export interface LoadoutSlot {
    name: string
    model?: string
    helmet?: string
    mask?: string
    gloves?: string
    boots?: string
    holster?: string
    equipment?: string[]
    requisitions?: string[]
    perks?: string[]
}

export function getItem(itemClass: any) {
    return LOADOUTS[itemClass as keyof typeof LOADOUTS]
}

function padEmptyWithZeroes(array: number[], size: number) {
    for (let i = 0; i < size; i++) {
        if(!array[i]) array[i] = 0
    }
}

export async function setBackpack(strPrimaries: string[], strSecondaries: string[]) {
    const primaries: number[] = []
    const secondaries: number[] = []


    // eslint-disable-next-line guard-for-in
    for (const itemName of strPrimaries) {
        const item = getItem(itemName)
        if (!item) throw new Error(`Invalid item '${item}'`)
        primaries.push(item.id)
    }

    // eslint-disable-next-line guard-for-in
    for (const itemName of strSecondaries) {
        const item = getItem(itemName)
        if (!item) throw new Error(`Invalid item '${item}'`)
        secondaries.push(item.id)
    }

    if (secondaries.length > 4) {
        throw new Error(`Too many secondaries! ${secondaries.length} > 4`)
    }

    if (primaries.length > 9) {
        throw new Error(`Too many primaries! ${primaries.length} > 9`)
    }

    padEmptyWithZeroes(secondaries, 4)
    padEmptyWithZeroes(primaries, 9)

    const backpack = new Parser()
    .endianess("little")
    .uint32("header")

    .uint32("secondaryCount")
    .array("secondaries", {
        type: "uint32le",
        length: 4
    })

    .uint32("primaryCount")
    .array("primaries", {
        type: "uint32le",
        length: 9
    })

    const data = backpack.encode({
        header: 101,
        secondaryCount: 4,
        secondaries,
        primaryCount: 9,
        primaries
    })


    try {
        await jetpack.writeAsync(path.resolve(appPath.backpackDir, "backpack.dat"), data)
    } catch(err) {
        throw new Error(`Error saving backpack.dat - ${err}`)
    }
}

function makeLoadoutSlot(parser: Parser, input: any, team: string, data: LoadoutSlot) {
    parser
    .uint16(`header${team}`)
    .uint16(`model${team}`)
    .uint16(`helmet${team}`)
    .uint16(`mask${team}`)
    .uint16(`gloves${team}`)
    .uint16(`boots${team}`)
    .uint16(`holster${team}`)
    .array(`unknown${team}`, {
        type: "uint16le",
        length: 3
    })

    .array(`equipment${team}`, {
        type: "uint16le",
        length: 2
    })

    .array(`requisitions${team}`, {
        type: "uint16le",
        length: 2
    })

    .array(`perks${team}`, {
        type: "uint16le",
        length: 3
    })

    .uint16(`nameLen${team}`)
    .string(`name${team}`, {
        encoding: "utf-8",
        zeroTerminated: true,
        length: data.name.length + 1,
    })

    input[`header${team}`] = 770
    input[`model${team}`] = getItem(data.model)?.id || 0
    input[`helmet${team}`] = getItem(data.helmet)?.id || 0
    input[`mask${team}`] = getItem(data.mask)?.id || 0
    input[`gloves${team}`] = getItem(data.gloves)?.id || 0
    input[`boots${team}`] = getItem(data.boots)?.id || 0
    input[`holster${team}`] = getItem(data.holster)?.id || 0
    input[`unknown${team}`] = [0, 0, 0]
    input[`equipment${team}`] = [
        getItem(data.equipment?.[0]) || 0,
        getItem(data.equipment?.[1]) || 0
    ]
    input[`requisitions${team}`] = [
        getItem(data.requisitions?.[0]) || 0,
        getItem(data.requisitions?.[1]) || 0
    ]
    input[`perks${team}`] = [
        getItem(data.perks?.[0]) || 0,
        getItem(data.perks?.[1]) || 0,
        getItem(data.perks?.[2]) || 0
    ]

    input[`nameLen${team}`] = (data.name || "").length + 1
    input[`name${team}`] = data.name || ""

    return input
}

export async function setLoadoutSlot(slotId: number, slotCT: LoadoutSlot, slotT: LoadoutSlot) {
    const slot = new Parser()
    .endianess("little")

    let input = {}
    input = makeLoadoutSlot(slot, input, "CT", slotCT)
    input = makeLoadoutSlot(slot, input, "T", slotT)

    const data = slot.encode(input)

    try {
        await jetpack.writeAsync(path.resolve(appPath.backpackDir, "loadouts", `slot_${slotId}.dat`), data, {mode: "binary"})
    } catch(err) {
        throw new Error(`Error saving slot_${slotId}.dat - ${err}`)
    }
}
