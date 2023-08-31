import { Button, Card, Dialog, DialogBody, DialogFooter, FormGroup, H3, H4, H5, Icon, InputGroup } from "@blueprintjs/core"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

export function ConnectDialog({open, onClosed}: {open: boolean, onClosed: any}) {
    const {register, handleSubmit, control, formState: {errors}} = useForm()
    const [serverIsValid, setServerIsValid] = useState(false)
    const [serverData, setServerData] = useState(null)

    async function onIpChanged(event: any) {
        const ipStr: string = event.target.value
        setServerIsValid(false)
        setServerData(null)

        if (!ipStr || ipStr.trim() === "") return
        if (!ipStr.match(/^(([0-9]{1,3}\.){3}[0-9]{1,3})(:[0-9]{1,5})?$/g)) return
        const split = ipStr.split(":")
        const ip = split[0]
        const port = parseInt(split[1], 10) || 27015

        const serverInfo = await window.electron.ipcRenderer.invoke("game:queryServer", ip, port)
        if (!serverInfo) return
        setServerIsValid(true)
        setServerData(serverInfo)
    }

    async function connectFormSubmit(data: any, event: any) {
        if (!serverIsValid) return
        if (data.password && data.password.trim() === "") data.password = undefined

        const connecting = await window.electron.ipcRenderer.invoke("game:connectServer", data.ip, data.password)
        if (connecting) onClosed()
    }

    const intent = serverIsValid && "success" || (errors.ip && "danger")
    console.log(serverData)
    return (
        <Dialog
            isOpen={open}
            onClose={onClosed}
            className="bp5-dark"
            title="Connect to a server"
            icon="send-to"
        >
                <form onSubmit={handleSubmit(connectFormSubmit)}>
                    <DialogBody>
                        <FormGroup
                            helperText={serverIsValid && "This server is valid - ready to connect!" || "The IP address for the server you wish to connect to"}
                            label="Server IP Address"
                            intent={intent}
                        >
                            <Controller
                                name="ip"
                                control={control}
                                rules={{required: true, onChange: (e) => (onIpChanged(e))}}
                                render={({field}) => (
                                    <InputGroup
                                        {...field}
                                        placeholder="IP address"
                                        intent={intent}
                                    />
                                )}
                            />
                        </FormGroup>

                        {/* <FormGroup
                            helperText="If the server has a password, enter it here"
                            label="Server Password"
                            labelInfo="(optional)"
                            disabled={!serverIsValid}
                        >
                            <Controller
                                name="password"
                                control={control}
                                render={({field}) => (
                                    <InputGroup
                                        {...field}
                                        placeholder=""
                                        disabled={!serverIsValid}
                                        leftIcon="key"
                                        type="password"
                                    />
                                )}
                            />
                        </FormGroup> */}

                        {serverData && (
                            <Card>
                                <div>
                                    <H4>{serverData.info.name}</H4>
                                    <p className="muted">
                                        <Icon icon="user"/> {serverData.info.players}/{serverData.info.max_players}<br/>
                                        <Icon icon="map"/> {serverData.info.map}
                                    </p>
                                </div>
                            </Card>
                        )}
                    </DialogBody>

                    <DialogFooter
                        actions={
                            <Button
                                intent="primary"
                                type="submit"
                                disabled={!serverIsValid}
                            >
                                Connect
                            </Button>
                        }
                    />
                </form>
        </Dialog>
    )
}
