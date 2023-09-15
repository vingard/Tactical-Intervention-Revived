import { Button, Card, MenuItem, Dialog, DialogBody, DialogFooter, Tab, Tabs, FormGroup, InputGroup, H2, H3, H4, H5 } from "@blueprintjs/core"
import { useEffect, useRef, useState } from "react"
import { Controller, FormProvider, useForm } from "react-hook-form"
import { preventEnterKeySubmission } from "renderer/util"
import { LoadoutItem, LoadoutItemMultiSelect } from "./loadout_item_multi_select"
import { LoadoutItemSelect } from "./loadout_item_select"

interface LoadoutDataStruct {
    secondaries: LoadoutItem[]
    primaries: LoadoutItem[]
    models: LoadoutItem[]
    helmets: LoadoutItem[]
    masks: LoadoutItem[]
    gloves: LoadoutItem[]
    boots: LoadoutItem[]
    holsters: LoadoutItem[]
    equipment: LoadoutItem[]
    requisitions: LoadoutItem[]
    perks: LoadoutItem[]
}

function TeamSlotPanel({team, slot, control, errors, loadoutData}: {team: "CT" | "T", slot: number, control: any, errors: any, loadoutData: LoadoutDataStruct}) {
    const key = `slots[${slot}].${team}`

    return (
        <div>
            <FormGroup
                helperText="The display name for this slot"
                label="Name"
                intent={errors[`${key}.name`] && "danger"}
            >
                <Controller
                    name={`${key}.name`}
                    control={control}
                    rules={{required: true}}
                    render={({field}) => (
                        <InputGroup
                            {...field}
                            placeholder="Name"
                            intent={errors[`${key}.name`] && "danger"}
                        />
                    )}
                />
            </FormGroup>

            <FormGroup
                label="Model"
                intent={errors[`${key}.model`] && "danger"}
            >
                <Controller
                    name={`${key}.model`}
                    control={control}
                    rules={{required: true}}
                    render={({field}) => (
                        <LoadoutItemSelect
                            {...field}
                            availableItems={loadoutData?.models || []}
                        />
                    )}
                />
            </FormGroup>

            <FormGroup
                helperText=""
                label="Helmet"
                intent={errors[`${key}.helmet`] && "danger"}
            >
                <Controller
                    name={`${key}.helmet`}
                    control={control}
                    rules={{required: false}}
                    render={({field}) => (
                        <LoadoutItemSelect
                            {...field}
                            noneOption
                            availableItems={loadoutData?.helmets || []}
                        />
                    )}
                />
            </FormGroup>

            <FormGroup
                helperText=""
                label="Mask"
                intent={errors[`${key}.mask`] && "danger"}
            >
                <Controller
                    name={`${key}.mask`}
                    control={control}
                    rules={{required: false}}
                    render={({field}) => (
                        <LoadoutItemSelect
                            {...field}
                            noneOption
                            availableItems={loadoutData?.masks || []}
                        />
                    )}
                />
            </FormGroup>

            <FormGroup
                helperText=""
                label="Gloves"
                intent={errors[`${key}.gloves`] && "danger"}
            >
                <Controller
                    name={`${key}.gloves`}
                    control={control}
                    rules={{required: false}}
                    render={({field}) => (
                        <LoadoutItemSelect
                            {...field}
                            noneOption
                            availableItems={loadoutData?.gloves || []}
                        />
                    )}
                />
            </FormGroup>

            <FormGroup
                helperText=""
                label="Boots"
                intent={errors[`${key}.boots`] && "danger"}
            >
                <Controller
                    name={`${key}.boots`}
                    control={control}
                    rules={{required: false}}
                    render={({field}) => (
                        <LoadoutItemSelect
                            {...field}
                            noneOption
                            availableItems={loadoutData?.boots || []}
                        />
                    )}
                />
            </FormGroup>

            <FormGroup
                helperText=""
                label="Holster"
                intent={errors[`${key}.holster`] && "danger"}
            >
                <Controller
                    name={`${key}.holster`}
                    control={control}
                    rules={{required: false}}
                    render={({field}) => (
                        <LoadoutItemSelect
                            {...field}
                            noneOption
                            availableItems={loadoutData?.holsters || []}
                        />
                    )}
                />
            </FormGroup>

            <FormGroup
                helperText=""
                label="Equipment"
                intent={errors[`${key}.equipment`] && "danger"}
            >
                <Controller
                    name={`${key}.equipment`}
                    control={control}
                    rules={{required: false}}
                    render={({field}) => (
                        <LoadoutItemSelect
                            {...field}
                            noneOption
                            availableItems={loadoutData?.equipment || []}
                        />
                    )}
                />
            </FormGroup>

            <FormGroup
                helperText=""
                label="Requisitions"
                intent={errors[`${key}.requisitions`] && "danger"}
            >
                <Controller
                    name={`${key}.requisitions`}
                    control={control}
                    rules={{required: true}}
                    render={({field}) => (
                        <LoadoutItemMultiSelect
                            {...field}
                            availableItems={loadoutData?.requisitions || []}
                            maxItems={3}
                        />
                    )}
                />
            </FormGroup>

            <FormGroup
                helperText=""
                label="Perks"
                intent={errors[`${key}.perks`] && "danger"}
            >
                <Controller
                    name={`${key}.perks`}
                    control={control}
                    rules={{required: false}}
                    render={({field}) => (
                        <LoadoutItemMultiSelect
                            {...field}
                            availableItems={loadoutData?.perks}
                            maxItems={3}
                        />
                    )}
                />
            </FormGroup>
        </div>
    )
}

function SlotPanel({slot, control, errors, loadoutData}: {slot: number, control: any, errors: any, loadoutData: any}) {
    return (
        <div style={{display: "flex"}}>
            <Card className="ctBackground">
                <H4>Counter-Terrorist</H4>
                <TeamSlotPanel
                    team="CT"
                    slot={slot}
                    control={control}
                    errors={errors}
                    loadoutData={loadoutData.CT}
                />
            </Card>

            <Card className="tBackground">
                <H4>Terrorist</H4>
                <TeamSlotPanel
                    team="T"
                    slot={slot}
                    control={control}
                    errors={errors}
                    loadoutData={loadoutData.T}
                />
            </Card>
        </div>
    )
}

function getItemClassType(item: LoadoutItem) {
    const {tags} = item
    if (!tags) return
    if (tags.includes("smg")) return "SMG"
    if (tags.includes("rifle")) return "Rifle"
    if (tags.includes("sniper_rifle")) return "Sniper Rifle"
    if (tags.includes("shotgun")) return "Shotgun"
    if (tags.includes("pistol")) return "Pistol"
}

function sortByType(a: LoadoutItem, b: LoadoutItem) {
    if (!a.type || !b.type) return -1
    if (a.type < b.type) return -1
    if (a.type > b.type) return 1
    return 0
}

function itemToItemKey(item: LoadoutItem) {
    return item?.key
}

export function LoadoutDialog({open, onClosed}: {open: boolean, onClosed: any}) {
    const formMethods = useForm()
    const {register, handleSubmit, control, setValue, formState: {errors}} = formMethods
    const [loadoutData, setLoadoutData] = useState<LoadoutDataStruct>()
    const [sortedTeamLoadoutData, setSortedTeamLoadoutData] = useState({})
    const [loadoutReceived, setLoadoutReceived] = useState(false)

    async function loadoutFormSubmit(data: any, event: any) {
        const primaries = []
        const secondaries = []
        const slots = []

        for (const item of data.primaries) {
            primaries.push(item.key)
        }

        for (const item of data.secondaries) {
            secondaries.push(item.key)
        }

        function teamSlotToKeys(team: "CT" | "T", inSlot: any) {
            const slot: any = {}

            slot.name = inSlot[team].name
            slot.model = itemToItemKey(inSlot[team].model)
            slot.helmet = itemToItemKey(inSlot[team].helmet)
            slot.mask = itemToItemKey(inSlot[team].mask)
            slot.gloves = itemToItemKey(inSlot[team].gloves)
            slot.boots = itemToItemKey(inSlot[team].boots)
            slot.holster = itemToItemKey(inSlot[team].holster)
            slot.equipment = itemToItemKey(inSlot[team].equipment)

            const requisitions = []
            for (const i of inSlot[team].requisitions || []) {
                requisitions.push(i.key)
            }

            slot.requisitions = requisitions

            const perks = []
            for (const i of inSlot[team].perks || []) {
                perks.push(i.key)
            }

            slot.perks = perks

            return slot
        }

        for (const slot of data.slots) {
            slots.push({
                CT: teamSlotToKeys("CT", slot),
                T: teamSlotToKeys("T", slot)
            })
        }

        const success = await window.electron.ipcRenderer.invoke("game:setLoadout", {primaries, secondaries}, slots)
        onClosed()
    }

    useEffect(() => {
        (async () => {
            const data = await window.electron.ipcRenderer.invoke("game:getLoadoutData")
            const allItems: LoadoutItem[] = Object.entries(data).map(([key, value]: any) => ({...value, key, type: getItemClassType(value)}))
            const loadoutDataArr: LoadoutDataStruct = {primaries: [], secondaries: [], models: [], helmets: [], masks: [], gloves: [], boots: [], holsters: [], equipment: [], requisitions: [], perks: []}
            const loadoutTeamSortedDataArr: any = {T: {}, CT: {}}

            for (const item of allItems) {
                const {tags} = item
                let itemTeamLock: "CT" | "T" | undefined

                if (!tags || tags.includes("hidden")) continue // skip items with hidden tag

                // Work out if item is team locked
                if (tags.includes("counter_terrorist")) itemTeamLock = "CT"
                else if (tags.includes("terrorist")) itemTeamLock = "T"

                const newItem = {...item, team: itemTeamLock}

                // Sort into groups
                if (tags.includes("primary")) loadoutDataArr.primaries.push(newItem)
                else if (tags.includes("secondary")) loadoutDataArr.secondaries.push(newItem)
                else if (tags.includes("model")) loadoutDataArr.models.push(newItem)
                else if (tags.includes("helmet")) loadoutDataArr.helmets.push(newItem)
                else if (tags.includes("mask")) loadoutDataArr.masks.push(newItem)
                else if (tags.includes("gloves")) loadoutDataArr.gloves.push(newItem)
                else if (tags.includes("boots")) loadoutDataArr.boots.push(newItem)
                else if (tags.includes("holster")) loadoutDataArr.holsters.push(newItem)
                else if (tags.includes("equipment")) loadoutDataArr.equipment.push(newItem)
                else if (tags.includes("requisition")) loadoutDataArr.requisitions.push(newItem)
                else if (tags.includes("perk")) loadoutDataArr.perks.push(newItem)
            }

            loadoutDataArr.primaries.sort(sortByType)
            loadoutDataArr.secondaries.sort(sortByType)

            // eslint-disable-next-line guard-for-in
            for (const category in loadoutDataArr) {
                const key = category as keyof typeof loadoutDataArr
                // eslint-disable-next-line no-multi-assign
                loadoutTeamSortedDataArr.T[category] = loadoutDataArr[key].filter((x: LoadoutItem) => !x.team || x.team === "T")
                loadoutTeamSortedDataArr.CT[category] = loadoutDataArr[key].filter((x: LoadoutItem) => !x.team || x.team === "CT")
            }

            setLoadoutData(loadoutDataArr)
            setSortedTeamLoadoutData(loadoutTeamSortedDataArr)

            console.warn("loadoutData recalculated [EXPENSIVE]")
        })()
    }, [])

    useEffect(() => {
        async function getLoadoutData() {
            const data = await window.electron.ipcRenderer.invoke("game:getLoadout")
            const primaries = []

            for (const i of data.backpack.primaries) {
                primaries.push(loadoutData?.primaries.find(x => x.key === i))
            }

            const secondaries = []

            for (const i of data.backpack.secondaries) {
                secondaries.push(loadoutData?.secondaries.find(x => x.key === i))
            }

            setValue("primaries", primaries)
            setValue("secondaries", secondaries)

            function setSlotValues(team: "CT" | "T", slotId: number, slot: any) {
                const key = `slots[${slotId}].${team}`

                setValue(`${key}.name`, slot.name)
                setValue(`${key}.model`, loadoutData?.models.find(x => x.key === slot.model))
                setValue(`${key}.helmet`, loadoutData?.helmets.find(x => x.key === slot.helmet))
                setValue(`${key}.mask`, loadoutData?.masks.find(x => x.key === slot.mask))
                setValue(`${key}.gloves`, loadoutData?.gloves.find(x => x.key === slot.gloves))
                setValue(`${key}.boots`, loadoutData?.boots.find(x => x.key === slot.boots))
                setValue(`${key}.holster`, loadoutData?.holsters.find(x => x.key === slot.holster))
                setValue(`${key}.equipment`, loadoutData?.equipment.find(x => x.key === slot.equipment))

                const requisitions = []
                for (const i of slot.requisitions || []) {
                    requisitions.push(loadoutData?.requisitions.find(x => x.key === i))
                }
                setValue(`${key}.requisitions`, requisitions)

                const perks = []
                for (const i of slot.perks || []) {
                    perks.push(loadoutData?.perks.find(x => x.key === i))
                }
                setValue(`${key}.perks`, perks)
            }

            let slotId = 0
            for (const slot of data.loadouts) {
                setSlotValues("T", slotId, slot.T)
                setSlotValues("CT", slotId, slot.CT)
                slotId++
            }
            // TODO: Set slots!
            setLoadoutReceived(true)
        }

        if (open === true) getLoadoutData()
    }, [open, setValue])

    if (!loadoutData) return

    return (
        <div>
            <Dialog
                isOpen={open}
                onClose={onClosed}
                className="bp5-dark"
                title="Edit Loadout"
                icon="ammunition"
                canOutsideClickClose={false}
                style={{width: "56rem"}}
            >
                <FormProvider {...formMethods}>
                    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                    <form onSubmit={handleSubmit(loadoutFormSubmit)} onKeyDown={preventEnterKeySubmission}>
                        <DialogBody>
                            <div>
                                <FormGroup
                                    helperText="Primary weapons (max. 9)"
                                    label={<H4>Primaries</H4>}
                                    intent={errors.primaries && "danger"}
                                >
                                    <Controller
                                        name="primaries"
                                        control={control}
                                        rules={{required: true}}
                                        render={({field}) => (
                                            <LoadoutItemMultiSelect
                                                {...field}
                                                availableItems={loadoutData?.primaries || []}
                                                maxItems={9}
                                                big
                                            />
                                        )}
                                    />
                                </FormGroup>

                                <FormGroup
                                    helperText="Secondary weapons (max. 4)"
                                    label={<H4>Secondaries</H4>}
                                    intent={errors.secondaries && "danger"}
                                >
                                    <Controller
                                        name="secondaries"
                                        control={control}
                                        rules={{required: true}}
                                        render={({field}) => (
                                            <LoadoutItemMultiSelect
                                                {...field}
                                                availableItems={loadoutData?.secondaries || []}
                                                maxItems={4}
                                                big
                                            />
                                        )}
                                    />
                                </FormGroup>

                                {/* <Button fill text={selectedLoadoutItem && itemGetName(selectedLoadoutItem) || "Select an item..."} rightIcon="double-caret-vertical" placeholder="Select an item"/> */}
                            </div>

                            <H4>Slots</H4>
                            <Tabs id="slots">
                                <Tab id="slot1" title={<H5>Slot 1</H5>} panel={<SlotPanel slot={0} control={control} errors={errors} loadoutData={sortedTeamLoadoutData}/>}/>
                                <Tab id="slot2" title={<H5>Slot 2</H5>} panel={<SlotPanel slot={1} control={control} errors={errors} loadoutData={sortedTeamLoadoutData}/>}/>
                                <Tab id="slot3" title={<H5>Slot 3</H5>} panel={<SlotPanel slot={2} control={control} errors={errors} loadoutData={sortedTeamLoadoutData}/>}/>
                            </Tabs>
                        </DialogBody>

                        <DialogFooter
                            actions={
                                <Button
                                    intent="primary"
                                    type="submit"
                                >
                                    Save
                                </Button>
                            }
                        />
                    </form>
                </FormProvider>
            </Dialog>
        </div>
    )
}
