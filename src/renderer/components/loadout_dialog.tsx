import { Button, Card, Dialog, DialogBody, DialogFooter, Tab, Tabs } from "@blueprintjs/core"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

function SlotPanel({slot}: {slot: number}) {
    return (
        <p>{slot}</p>
    )
}

export function LoadoutDialog({open, onClosed}: {open: boolean, onClosed: any}) {
    const {register, handleSubmit, control, setValue, formState: {errors}} = useForm()
    const [loadout, setLoadout] = useState(null)

    async function loadoutFormSubmit(data: any, event: any) {
        //const success = await window.electron.ipcRenderer.invoke("mod:install", modData.url, data.mount)
        onClosed()
    }

    useEffect(() => {
    }, [open, setValue])

    return (
        <div>
            <Dialog
                isOpen={open}
                onClose={onClosed}
                className="bp5-dark"
                title="Edit Loadout"
                icon="ammunition"
            >
                <form onSubmit={handleSubmit(loadoutFormSubmit)}>
                    <DialogBody>
                        <Tabs id="slots">
                            <Tab id="slot1" title="Slot 1" panel={<SlotPanel slot={1}/>}/>
                            <Tab id="slot2" title="Slot 2" panel={<SlotPanel slot={2}/>}/>
                            <Tab id="slot3" title="Slot 3" panel={<SlotPanel slot={3}/>}/>
                            <Tab id="slot4" title="Slot 4" panel={<SlotPanel slot={4}/>}/>
                        </Tabs>
                        loadout
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
            </Dialog>
        </div>
    )
}
