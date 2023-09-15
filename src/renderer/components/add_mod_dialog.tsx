import { Button, Callout, Card, Dialog, DialogBody, DialogFooter, FormGroup, H4, H5, H6, Icon, InputGroup, Switch, TextArea } from "@blueprintjs/core"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { LoadingBar } from "./loadingbar"
import { WorkerDialog } from "./worker_dialog"

export function AddModDialog({open, onClosed}: {open: boolean, onClosed: any}) {
    const {register, handleSubmit, control, setValue, setError, clearErrors, formState: {errors}} = useForm()
    const [modData, setModData] = useState(null)
    const [installing, setInstalling] = useState(false)

    async function onUrlChanged(event: any) {
        clearErrors()
        setModData(null)

        let urlStr: string = event.target.value
        urlStr = urlStr.trim()
        // regex to check if its a github repo url, and get the dev/repo slug
        const matches = urlStr.match(/github.com[:/](.*)/g)
        if (!matches || !matches[0]) return
        // eslint-disable-next-line prefer-destructuring
        urlStr = `https://${matches[0]}`

        const {mod, error} = await window.electron.ipcRenderer.invoke("mod:query", urlStr)
        console.log("modQuery", mod)

        // forgive me for this awful hack D: - i will standardise a error popup across the whole app soon
        if (error && !error.includes("Could not find")) return setError("url", {message: error})

        if (!mod) return
        setModData(mod)
    }

    async function addModFormSubmit(data: any, event: any) {
        if (!modData) return

        setInstalling(true)
        const {success, error} = await window.electron.ipcRenderer.invoke("mod:install", modData.url, data.mount)
        if (error) setError("url", {message: error})

        setInstalling(false)
        onClosed()
    }

    useEffect(() => {
    }, [open, setValue])

    return (
        <div>
            {modData && <WorkerDialog
                open={installing}
                title={`Installing ${modData.name || modData.uid}`}
                icon="cloud-download"
                loadingStateId={`mod_${modData.uid}`}
                onClosed={() => setInstalling(false)}
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
                            helperText={errors.url?.message || "GitHub repository URL of the mod you wish to install"}
                            intent={errors.url && "danger" || (modData && "success")}
                        >
                            <Controller
                                name="url"
                                control={control}
                                rules={{required: true, onChange: (e) => (onUrlChanged(e))}}
                                render={({field}) => (
                                    <InputGroup
                                        {...field}
                                        placeholder="www.github.com/x/x"
                                        intent={errors.url && "danger" || (modData && "success")}
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
                            <Callout>
                            <H4 style={{marginBottom: "0"}}>{modData.name}</H4> <p className="muted" style={{marginBottom: "0"}}>{modData.version}</p>
                            {modData.author && <p style={{marginTop: "0px", color: "#d1d1d1", fontSize: 12, fontWeight: 500}}>Created by: {modData.author}</p>}

                            {modData.description && (
                                <p style={{marginTop: "0px", color: "#d1d1d1", fontSize: 13, fontWeight: 400, wordWrap: "break-word"}}>
                                    {modData.description}
                                </p>
                            )}

                            <p style={{fontSize: 10, color: "#878787", opacity: 0.7, marginBottom: "0px", marginTop: "1rem"}}>{modData.uid}</p>
                            </Callout>
                        </Card>
                    )}


                    <DialogFooter
                        actions={
                            <>
                                {/* {modData && <p style={{fontSize: 10, color: "#878787"}}>{modData.uid}</p>} */}
                                <Button
                                    intent="primary"
                                    type="submit"
                                    disabled={modData === null}
                                >
                                    Install Mod
                                </Button>
                            </>
                        }
                    />
                </form>
            </Dialog>
        </div>
    )
}
