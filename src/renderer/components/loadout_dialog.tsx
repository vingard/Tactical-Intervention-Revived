import { Button, Card, MenuItem, Dialog, DialogBody, DialogFooter, Tab, Tabs, FormGroup } from "@blueprintjs/core"
import { useEffect, useRef, useState } from "react"
import { Controller, FormProvider, useForm } from "react-hook-form"
import { preventEnterKeySubmission } from "renderer/util"
import { LoadoutItem, LoadoutItemSelect } from "./loadout_item_select"

function SlotPanel({slot}: {slot: number}) {
    return (
        <p>{slot}</p>
    )
}

interface LoadoutDataStruct {
    secondaries: LoadoutItem[]
    primaries: LoadoutItem[]
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
    const inputRef = useRef(null)

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
            let loadoutDataArr: LoadoutItem[] = Object.entries(data).map(([key, value]: any) => ({...value, key, type: getItemClassType(value)}))
            loadoutDataArr = loadoutDataArr.filter((x) => !x.tags?.includes("unequippable"))

            setLoadoutData({
                primaries: loadoutDataArr.filter((x) => x.tags?.includes("primary")).sort(sortByType),
                secondaries: loadoutDataArr.filter((x) => x.tags?.includes("secondary")).sort(sortByType)
            })
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

            console.log("prim", primaries)
            //setValue("primaries", primaries)
            //setValue("secondaries", data.backpack.secondaries || [])
            // TODO: Set slots!
            setLoadoutReceived(true)
        }

        if (open === true) getLoadoutData()
    }, [open, setValue])

    console.log(errors)

    return (
        <div>
            <Dialog
                isOpen={open}
                onClose={onClosed}
                className="bp5-dark"
                title="Edit Loadout"
                icon="ammunition"
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
                                            <LoadoutItemSelect
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
                                            <LoadoutItemSelect
                                                {...field}
                                                ref={inputRef}
                                                availableItems={loadoutData?.secondaries || []}
                                                maxItems={4}
                                            />
                                        )}
                                    />
                                </FormGroup>

                                {/* <Button fill text={selectedLoadoutItem && itemGetName(selectedLoadoutItem) || "Select an item..."} rightIcon="double-caret-vertical" placeholder="Select an item"/> */}
                            </div>

                            <Tabs id="slots">
                                <Tab id="slot1" title="Slot 1" panel={<SlotPanel slot={1}/>}/>
                                <Tab id="slot2" title="Slot 2" panel={<SlotPanel slot={2}/>}/>
                                <Tab id="slot3" title="Slot 3" panel={<SlotPanel slot={3}/>}/>
                                <Tab id="slot4" title="Slot 4" panel={<SlotPanel slot={4}/>}/>
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
