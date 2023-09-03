import { Button, Card, Dialog, DialogBody, DialogFooter, FormGroup, H4, H5, H6, Icon, InputGroup, Switch, TextArea } from "@blueprintjs/core"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { LoadingBar } from "./loadingbar"
import { WorkerDialog } from "./worker_dialog"

export function AddModDialog({open, onClosed}: {open: boolean, onClosed: any}) {
    const {register, handleSubmit, control, setValue, formState: {errors}} = useForm()
    const [modData, setModData] = useState(null)
    const [installing, setInstalling] = useState(false)

    async function onUrlChanged(event: any) {
        setModData(null)

        let urlStr: string = event.target.value
        urlStr = urlStr.trim()
        // regex to check if its a github repo url, and get the dev/repo slug
        const matches = urlStr.match(/github.com[:/](.*)/g)
        if (!matches || !matches[0]) return
        // eslint-disable-next-line prefer-destructuring
        urlStr = `https://${matches[0]}`

        const modInfo = await window.electron.ipcRenderer.invoke("mod:query", urlStr)
        if (!modInfo) return
        setModData(modInfo)
    }

    async function addModFormSubmit(data: any, event: any) {
        if (!modData) return

        setInstalling(true)
        const success = await window.electron.ipcRenderer.invoke("mod:install", modData.url, data.mount)
        setInstalling(false)
        onClosed()
    }

    useEffect(() => {
    }, [open, setValue])

    return (
        <div>
            {modData && <WorkerDialog
                open={installing}
                title={`Installing ${modData.prettyName || modData.name}`}
                icon="cloud-download"
                loadingStateId={`mod_${modData.name}`}
            />}

            <Dialog
                isOpen={open && !installing}
                onClose={onClosed}
                className="bp5-dark"
                title="Add a Mod"
                icon="add"
            >
                <form onSubmit={handleSubmit(addModFormSubmit)}>
                    <DialogBody>
                        <FormGroup
                            label="Mod URL"
                            helperText="GitHub repository URL of the mod you wish to install"
                            intent={errors.username && "danger" || (modData && "success")}
                        >
                            <Controller
                                name="url"
                                control={control}
                                rules={{required: true, onChange: (e) => (onUrlChanged(e))}}
                                render={({field}) => (
                                    <InputGroup
                                        {...field}
                                        placeholder="www.github.com/x/x"
                                        intent={errors.username && "danger" || (modData && "success")}
                                    />
                                )}
                            />
                        </FormGroup>

                        <FormGroup
                            label="Mount after install"
                            helperText="Should we automatically mount this mod after install?"
                            intent={errors.mount && "danger"}
                        >
                            <Switch
                                intent={errors.mount && "danger"}
                                {...register("mount")}
                            />
                        </FormGroup>
                    </DialogBody>

                    {modData && (
                        <Card>
                            <H4>{modData.name}</H4>
                            <p className="muted">
                                <Icon icon="changes"/> Version: {modData.version}
                            </p>

                            <p className="muted">
                                <Icon icon="cloud-download"/> Already downloaded
                            </p>
                        </Card>
                    )}


                    <DialogFooter
                        actions={
                            <Button
                                intent="primary"
                                type="submit"
                                disabled={modData === null}
                            >
                                Install Mod
                            </Button>
                        }
                    />
                </form>
            </Dialog>
        </div>
    )
}
