import { Button, Card, MenuItem, Dialog, DialogBody, DialogFooter, Tab, Tabs, FormGroup, InputGroup, H2, H3, H4, H5 } from "@blueprintjs/core"
import { useEffect, useRef, useState } from "react"
import { Controller, FormProvider, useForm } from "react-hook-form"
import { preventEnterKeySubmission } from "renderer/util"
import { LoadoutItem, LoadoutItemMultiSelect } from "./loadout_item_multi_select"
import { LoadoutItemSelect } from "./loadout_item_select"

interface LoadoutDataStruct {
    secondaries: LoadoutItem[]
    primaries: LoadoutItem[]
    modelsCT: LoadoutItem[]
    modelsT: LoadoutItem[]
    helmets: LoadoutItem[]
    masks: LoadoutItem[]
    gloves: LoadoutItem[]
    boots: LoadoutItem[]
    holsters: LoadoutItem[]
    equipment: LoadoutItem[]
    requisitions: LoadoutItem[]
    perks: LoadoutItem[]
    dogsCT: LoadoutItem[]
    dogsT: LoadoutItem[]
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
                helperText="Your character model"
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
                            availableItems={loadoutData?.[`models${team}`] || []}
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

function SlotPanel({slot, control, errors, loadoutData}: {slot: number, control: any, errors: any, loadoutData: LoadoutDataStruct}) {
    return (
        <div style={{display: "flex"}}>
            <Card className="ctBackground">
                <H4>Counter-Terrorist</H4>
                <TeamSlotPanel
                    team="CT"
                    slot={slot}
                    control={control}
                    errors={errors}
                    loadoutData={loadoutData}
                />
            </Card>

            <Card className="tBackground">
                <H4>Terrorist</H4>
                <TeamSlotPanel
                    team="T"
                    slot={slot}
                    control={control}
                    errors={errors}
                    loadoutData={loadoutData}
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
    const [loadoutReceived, setLoadoutReceived] = useState(false)

    async function loadoutFormSubmit(data: any, event: any) {
        console.log("loadout submit!", data)

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
            console.log("pperk")

            return slot
        }

        console.log("hm")

        for (const slot of data.slots) {
            console.log("loop slots")
            slots.push({
                CT: teamSlotToKeys("CT", slot),
                T: teamSlotToKeys("T", slot)
            })
            console.log("slot")
        }


        console.log("setLoadout to:", data)

        const success = await window.electron.ipcRenderer.invoke("game:setLoadout", {primaries, secondaries}, slots)
        onClosed()
    }

    useEffect(() => {
        (async () => {
            const data = await window.electron.ipcRenderer.invoke("game:getLoadoutData")
            const loadoutDataArr: LoadoutItem[] = Object.entries(data).map(([key, value]: any) => ({...value, key, type: getItemClassType(value)}))
            const equippables = loadoutDataArr.filter((x) => !x.tags?.includes("unequippable"))

            const models = loadoutDataArr.filter((x) => x.tags?.includes("model"))
            const dogs = loadoutDataArr.filter((x) => x.tags?.includes("dog"))

            setLoadoutData({
                primaries: equippables.filter((x) => x.tags?.includes("primary")).sort(sortByType),
                secondaries: equippables.filter((x) => x.tags?.includes("secondary")).sort(sortByType),
                modelsCT: models.filter((x) => x.tags?.includes("counter_terrorist")),
                modelsT: models.filter((x) => x.tags?.includes("terrorist")),
                helmets: equippables.filter((x) => x.tags?.includes("helmet")),
                masks: equippables.filter((x) => x.tags?.includes("mask")),
                gloves: equippables.filter((x) => x.tags?.includes("gloves")),
                boots: equippables.filter((x) => x.tags?.includes("boots")),
                holsters: equippables.filter((x) => x.tags?.includes("holster")),
                equipment: equippables.filter((x) => x.tags?.includes("equipment")),
                requisitions: loadoutDataArr.filter((x) => x.tags?.includes("requisition")),
                perks: equippables.filter((x) => x.tags?.includes("perk")),
                dogsCT: dogs.filter((x) => x.tags?.includes("counter_terrorist")),
                dogsT: dogs.filter((x) => x.tags?.includes("terrorist"))
            })

            console.warn("loadoutData recalculated [EXPENSIVE]")
        })()
    }, [])

    useEffect(() => {
        async function getLoadoutData() {
            const data = await window.electron.ipcRenderer.invoke("game:getLoadout")
            console.log("inbound", data)

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
                console.log(key)

                setValue(`${key}.name`, slot.name)
                setValue(`${key}.model`, loadoutData?.[`models${team}`].find(x => x.key === slot.model))
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

    console.log(errors)

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
                                <Tab id="slot1" title={<H5>Slot 1</H5>} panel={<SlotPanel slot={0} control={control} errors={errors} loadoutData={loadoutData}/>}/>
                                <Tab id="slot2" title={<H5>Slot 2</H5>} panel={<SlotPanel slot={1} control={control} errors={errors} loadoutData={loadoutData}/>}/>
                                <Tab id="slot3" title={<H5>Slot 3</H5>} panel={<SlotPanel slot={2} control={control} errors={errors} loadoutData={loadoutData}/>}/>
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
