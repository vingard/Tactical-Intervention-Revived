import { Button, Card, Dialog, DialogBody, DialogFooter, FormGroup, H3, H4, H5, Icon, InputGroup, Switch } from "@blueprintjs/core"
import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"

export function CreateServerDialog({open, onClosed}: {open: boolean, onClosed: any}) {
    const {register, handleSubmit, control, formState: {errors}} = useForm()
    const [defaultServerName, setDefaultServerName] = useState("")

    async function createServerFormSubmit(data: any, event: any) {
        console.log("submitServerForm")
        const connecting = await window.electron.ipcRenderer.invoke("game:createServer", data)
        if (connecting) onClosed()
    }

    useEffect(() => {
        async function onInit() {
            setDefaultServerName(await window.electron.ipcRenderer.invoke("game:getDefaultServerName"))
        }

        onInit()
    }, [])

    return (
        <Dialog
            isOpen={open}
            onClose={onClosed}
            className="bp5-dark"
            title="Create a Server"
            icon="globe-network"
        >
                <form onSubmit={handleSubmit(createServerFormSubmit)}>
                    <DialogBody>
                        <FormGroup
                            label="Name"
                            intent={errors.name && "danger"}
                        >
                            <Controller
                                name="name"
                                control={control}
                                rules={{required: true}}
                                render={({field}) => (
                                    <InputGroup
                                        {...field}
                                        placeholder={defaultServerName || ""}
                                        intent={errors.name && "danger"}
                                    />
                                )}
                            />
                        </FormGroup>

                        <FormGroup
                            label="Port"
                            helperText="Optional"
                            intent={errors.port && "danger"}
                        >
                            <Controller
                                name="port"
                                control={control}
                                render={({field}) => (
                                    <InputGroup
                                        {...field}
                                        type="number"
                                        placeholder="27015"
                                        intent={errors.port && "danger"}
                                    />
                                )}
                            />
                        </FormGroup>

                        <FormGroup
                            label="Smooth Driving"
                            helperText="Smooth driving allows clients to control their vehicles completely. You can disable this if you don't trust your players but it will make vehicles harder to control"
                            intent={errors.smoothDriving && "danger"}
                        >
                            <Switch
                                {...register("smoothDriving")}
                                defaultChecked
                            />
                        </FormGroup>

                        <FormGroup
                            label="Config File"
                            helperText="Optional - The contents of this .cfg file will be appended to the server configuration"
                            intent={errors.configFile && "danger"}
                        >
                            <Controller
                                name="configFile"
                                control={control}
                                render={({field}) => (
                                    <InputGroup
                                        {...field}
                                        placeholder=""
                                        spellCheck={false}
                                        intent={errors.configFile && "danger"}
                                    />
                                )}
                            />
                        </FormGroup>



                        <strong>{`Your server will only be visible on the public server browser if you have port-forwarded correctly.`}</strong>
                    </DialogBody>

                    <DialogFooter
                        actions={
                            <Button
                                intent="primary"
                                type="submit"
                            >
                                Create Server
                            </Button>
                        }
                    />
                </form>
        </Dialog>
    )
}
