import { Button, Card, MenuItem, Dialog, DialogBody, DialogFooter, Tab, Tabs, FormGroup, InputGroup } from "@blueprintjs/core"
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
    const key = `slots.${team}.${slot}`

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
                    rules={{required: true}}
                    render={({field}) => (
                        <LoadoutItemSelect
                            {...field}
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
                    rules={{required: true}}
                    render={({field}) => (
                        <LoadoutItemSelect
                            {...field}
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
                    rules={{required: true}}
                    render={({field}) => (
                        <LoadoutItemSelect
                            {...field}
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
                    rules={{required: true}}
                    render={({field}) => (
                        <LoadoutItemSelect
                            {...field}
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
                    rules={{required: true}}
                    render={({field}) => (
                        <LoadoutItemSelect
                            {...field}
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
                    rules={{required: true}}
                    render={({field}) => (
                        <LoadoutItemSelect
                            {...field}
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
                    rules={{required: true}}
                    render={({field}) => (
                        <LoadoutItemMultiSelect
                            {...field}
                            availableItems={loadoutData?.perks || []}
                            maxItems={3}
                        />
                    )}
                />
            </FormGroup>

            <FormGroup
                helperText=""
                label="Pet"
                intent={errors[`${key}.pet`] && "danger"}
            >
                <Controller
                    name={`${key}.pet`}
                    control={control}
                    rules={{required: true}}
                    render={({field}) => (
                        <LoadoutItemSelect
                            {...field}
                            availableItems={loadoutData?.[`dogs${team}`] || []}
                        />
                    )}
                />
            </FormGroup>

        </div>
    )
}

function SlotPanel({slot, control, errors, loadoutData}: {slot: number, control: any, errors: any, loadoutData: LoadoutDataStruct}) {
    return (
        <Card>
            <TeamSlotPanel
                team="CT"
                slot={slot}
                control={control}
                errors={errors}
                loadoutData={loadoutData}
            />

            <p>t:</p>
            <TeamSlotPanel
                team="T"
                slot={slot}
                control={control}
                errors={errors}
                loadoutData={loadoutData}
            />
        </Card>
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

export function LoadoutDialog({open, onClosed}: {open: boolean, onClosed: any}) {
    const formMethods = useForm()
    const {register, handleSubmit, control, setValue, formState: {errors}} = formMethods
    const [loadoutData, setLoadoutData] = useState<LoadoutDataStruct>()
    const [loadoutReceived, setLoadoutReceived] = useState(false)

    async function loadoutFormSubmit(data: any, event: any) {
        console.log("loadout submit!", data)

        const primaries = []
        const secondaries = []

        for (const item of data.primaries) {
            primaries.push(item.key)
        }

        for (const item of data.secondaries) {
            secondaries.push(item.key)
        }

        const success = await window.electron.ipcRenderer.invoke("game:setLoadout", {primaries, secondaries}, [])
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
                const key = `slots.${team}.${slotId}`
                console.log(key)
                setValue(`${key}.name`, slot.name)
                setValue(`${key}.model`, loadoutData?.[`models${team}`].find(x => x.key === slot.model))
                setValue(`${key}.helmet`, loadoutData?.helmets.find(x => x.key === slot.helmet))
                setValue(`${key}.mask`, loadoutData?.masks.find(x => x.key === slot.mask))
                setValue(`${key}.gloves`, loadoutData?.gloves.find(x => x.key === slot.gloves))
                setValue(`${key}.boots`, loadoutData?.boots.find(x => x.key === slot.boots))
                setValue(`${key}.holster`, loadoutData?.holsters.find(x => x.key === slot.holster))
                setValue(`${key}.equipment`, loadoutData?.equipment.find(x => x.key === slot.equipment))
                setValue(`${key}.requisitions`, loadoutData?.requisitions.find(x => x.key === slot.requisitions))
                setValue(`${key}.perks`, loadoutData?.perks.find(x => x.key === slot.perks))
                setValue(`${key}.pet`, loadoutData?.[`dogs${team}`].find(x => x.key === slot.pet))
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
                style={{width: "50rem"}}
            >
                <FormProvider {...formMethods}>
                    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                    <form onSubmit={handleSubmit(loadoutFormSubmit)} onKeyDown={preventEnterKeySubmission}>
                        <DialogBody>
                            <div>
                                <FormGroup
                                    helperText="Primaries (max 9)"
                                    label="Primary Weapons"
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
                                            />
                                        )}
                                    />
                                </FormGroup>

                                <FormGroup
                                    helperText="Secondaries (max 4)"
                                    label="Secondary Weapons"
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
                                            />
                                        )}
                                    />
                                </FormGroup>

                                {/* <Button fill text={selectedLoadoutItem && itemGetName(selectedLoadoutItem) || "Select an item..."} rightIcon="double-caret-vertical" placeholder="Select an item"/> */}
                            </div>

                            <Tabs id="slots">
                                <Tab id="slot1" title="Slot 1" panel={<SlotPanel slot={0} control={control} errors={errors} loadoutData={loadoutData}/>}/>
                                <Tab id="slot2" title="Slot 2" panel={<SlotPanel slot={1} control={control} errors={errors} loadoutData={loadoutData}/>}/>
                                <Tab id="slot3" title="Slot 3" panel={<SlotPanel slot={2} control={control} errors={errors} loadoutData={loadoutData}/>}/>
                                <Tab id="slot4" title="Slot 4" panel={<SlotPanel slot={3} control={control} errors={errors} loadoutData={loadoutData}/>}/>
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
