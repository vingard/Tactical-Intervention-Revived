import { Button, Dialog, DialogBody, DialogFooter, FormGroup, InputGroup, TextArea } from "@blueprintjs/core"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

export function SettingsDialog({open, onClosed}: {open: boolean, onClosed: any}) {
    const {register, handleSubmit, control, setValue, formState: {errors}} = useForm()
    const [serverIsValid, setServerIsValid] = useState(false)
    const [settingsReceived, setSettingsReceived] = useState(false)

    async function settingsFormSubmit(data: any, event: any) {
        data.username = data.username.trim()
        data.cfg = data.cfg.trim()

        const success = await window.electron.ipcRenderer.invoke("game:setSettings", data)

        if (success) onClosed()
    }

    useEffect(() => {
        async function getSettings() {
            const settings = await window.electron.ipcRenderer.invoke("game:getSettings")
            setValue("username", settings.username)
            setValue("cfg", settings.cfg)
            setSettingsReceived(true)
        }

        if (open === true) getSettings()
    }, [open, setValue])

    return (
        <div className={settingsReceived && "bp5-skeleton" || ""}>
            <Dialog
                isOpen={open}
                onClose={onClosed}
                className="bp5-dark"
                title="Settings"
                icon="cog"
            >
                <form onSubmit={handleSubmit(settingsFormSubmit)}>
                    <DialogBody>
                        <FormGroup
                            helperText="Your display name in online play"
                            label="Username"
                            labelInfo="(required)"
                            intent={errors.username && "danger"}
                        >
                            <Controller
                                name="username"
                                control={control}
                                rules={{required: true}}
                                render={({field}) => (
                                    <InputGroup
                                        {...field}
                                        placeholder="Username"
                                        intent={errors.username && "danger"}
                                    />
                                )}
                            />
                        </FormGroup>

                        <FormGroup
                            helperText="Edit your .cfg file parameters"
                            label="Config file"
                            intent={errors.cfg && "danger"}
                        >
                            <Controller
                                name="cfg"
                                control={control}
                                render={({field}) => (
                                    <TextArea
                                        {...field}
                                        placeholder="Enter .cfg file contents..."
                                        intent={errors.cfg && "danger"}
                                        fill
                                        small
                                        autoResize
                                        spellCheck={false}
                                        className="noScroll"
                                    />
                                )}
                            />
                        </FormGroup>
                    </DialogBody>

                    <DialogFooter
                        actions={
                            <Button
                                intent="primary"
                                type="submit"
                            >
                                Apply
                            </Button>
                        }
                    />
                </form>
            </Dialog>
        </div>
    )
}
