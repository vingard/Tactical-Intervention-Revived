import { Button, Dialog, DialogBody, DialogFooter, FormGroup, InputGroup } from "@blueprintjs/core"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

export function ConnectDialog({open, onClosed}: {open: boolean, onClosed: any}) {
    const {register, handleSubmit, control, formState: {errors}} = useForm()
    const [serverIsValid, setServerIsValid] = useState(false)

    async function onIpChanged(event: any) {
        const ipStr: string = event.target.value
        setServerIsValid(false)

        if (!ipStr || ipStr.trim() === "") return
        if (!ipStr.match(/^(([0-9]{1,3}\.){3}[0-9]{1,3})(:[0-9]{1,5})?$/g)) return
        const split = ipStr.split(":")
        const ip = split[0]
        const port = parseInt(split[1], 10) || 27015
        const serverExists = await window.electron.ipcRenderer.invoke("game:queryServer", ip, port)

        if (!serverExists) return
        setServerIsValid(true)
    }

    async function connectFormSubmit(data: any, event: any) {
        if (!serverIsValid) return

        const connecting = await window.electron.ipcRenderer.invoke("game:connectServer", data.ip)
        if (connecting) onClosed()
    }

    const intent = serverIsValid && "success" || (errors.ip && "danger")

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
