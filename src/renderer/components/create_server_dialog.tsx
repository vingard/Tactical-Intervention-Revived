import { Button, Card, Dialog, DialogBody, DialogFooter, FormGroup, H3, H4, H5, Icon, InputGroup, Switch } from "@blueprintjs/core"
import { useEffect, useMemo, useState } from "react"
import { Controller, FormProvider, useForm } from "react-hook-form"
import { MapSelect } from "./map_select"

export function CreateServerDialog({open, onClosed}: {open: boolean, onClosed: any}) {
    const formMethods = useForm()
    const {register, handleSubmit, control, getValues, formState: {errors}} = formMethods
    const [defaultServerName, setDefaultServerName] = useState("")
    const [maps, setMaps] = useState([])

    async function createServerFormSubmit(data: any, event: any) {
        console.log("submitServerForm")
        const connecting = await window.electron.ipcRenderer.invoke("game:createServer", data)
        if (connecting) onClosed()
    }

    useEffect(() => {
        async function onInit() {
            setDefaultServerName(await window.electron.ipcRenderer.invoke("game:getDefaultServerName"))
            setMaps(await window.electron.ipcRenderer.invoke("game:getMaps"))
        }

        onInit()
    }, [open])

    return (
        <Dialog
            isOpen={open}
            onClose={onClosed}
            className="bp5-dark"
            title="Create a Server"
            icon="globe-network"
            style={{width: "46rem"}}
        >
            <FormProvider {...formMethods}>
                <form onSubmit={handleSubmit(createServerFormSubmit)}>
                    <DialogBody>
                        <FormGroup
                            label="Name"
                            helperText="Optional"
                            intent={errors.name && "danger"}
                        >
                            <Controller
                                name="name"
                                control={control}
                                render={({field}) => (
                                    <InputGroup
                                        {...field}
                                        placeholder={defaultServerName || ""}
                                        intent={errors.name && "danger"}
                                    />
                                )}
                            />
                        </FormGroup>

                        <div style={{display: "flex", gap: "1rem"}}>
                            <div style={{width: "50%"}}>
                                <FormGroup
                                    label="Port"
                                    helperText="Optional - Port to host the server on, best to leave this as the default"
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
                            </div>

                            <div style={{width: "50%"}}>
                                <FormGroup
                                    label="Public Port"
                                    helperText="Optional - This is a public port this server is exposed on, if you are hosting with a proxy, the server port and public port may be different."
                                    intent={errors.publicPort && "danger"}
                                >
                                    <Controller
                                        name="publicPort"
                                        control={control}
                                        render={({field}) => (
                                            <InputGroup
                                                {...field}
                                                type="number"
                                                placeholder="Same as Port"
                                                intent={errors.publicPort && "danger"}
                                            />
                                        )}
                                    />
                                </FormGroup>
                            </div>
                        </div>

                        <FormGroup
                            label="Starting Map"
                            helperText="The starting level - map cycle rotations cannot be configured here yet"
                            intent={errors.initialMap && "danger"}
                        >
                            <Controller
                                name="initialMap"
                                control={control}
                                rules={{required: true}}
                                defaultValue="mis_highway"
                                render={({field}) => (
                                    <MapSelect
                                        {...field}
                                        availableMaps={maps}
                                    />
                                )}
                            />
                        </FormGroup>

                        <FormGroup
                            label="Is Hidden"
                            helperText="Hides your server from the public game list, all clients must connect directly via IP instead"
                            intent={errors.isHidden && "danger"}
                        >
                            <Switch
                                {...register("isHidden")}
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
                    >
                        <>
                        {`Read the `}
                            <a
                                href="https://github.com/vingard/Tactical-Intervention-Revived/wiki/Hosting-a-Server"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Server Hosting Guide
                            </a>
                        {` on the wiki`}
                        </>
                    </DialogFooter>
                </form>
            </FormProvider>
        </Dialog>
    )
}
