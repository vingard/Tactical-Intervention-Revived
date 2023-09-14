import { Button, Card, Dialog, DialogBody, DialogFooter, FormGroup, InputGroup, Tab, Tabs } from "@blueprintjs/core"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { v4 as uuid4 } from "uuid"

export function NewModDialog({open, onClosed}: {open: boolean, onClosed: any}) {
    const {register, handleSubmit, control, setValue, formState: {errors}} = useForm()

    function generateRandomUID() {
        setValue("uid", uuid4())
    }

    async function newModFormSubmit(data: any, event: any) {
        const success = await window.electron.ipcRenderer.invoke("mod:new", data)
        onClosed()
        generateRandomUID()
    }

    useEffect(() => {
    }, [open, setValue])

    useEffect(() => {
        generateRandomUID()
    }, [])

    return (
        <div>
            <Dialog
                isOpen={open}
                onClose={onClosed}
                className="bp5-dark"
                title="Create a new Mod"
                icon="new-object"
            >
                <form onSubmit={handleSubmit(newModFormSubmit)}>
                    <DialogBody>
                        <FormGroup
                            helperText="A unique string identifying this mod - automatically generated"
                            label="Unique ID"
                            intent={errors.uid && "danger"}
                        >
                            <Controller
                                name="uid"
                                control={control}
                                rules={{required: true}}
                                render={({field}) => (
                                    <InputGroup
                                        {...field}
                                        intent={errors.uid && "danger"}
                                        disabled
                                    />
                                )}
                            />
                        </FormGroup>

                        <FormGroup
                            helperText="The name of the mod that will be displayed to users"
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
                                        placeholder="Example Mod Name"
                                        intent={errors.name && "danger"}
                                    />
                                )}
                            />
                        </FormGroup>

                        <FormGroup
                            helperText="A short description of what the mod does"
                            label="Description"
                            intent={errors.description && "danger"}
                        >
                            <Controller
                                name="description"
                                control={control}
                                rules={{required: true}}
                                render={({field}) => (
                                    <InputGroup
                                        {...field}
                                        placeholder="The example mod acts as an example template for other mods."
                                        intent={errors.description && "danger"}
                                    />
                                )}
                            />
                        </FormGroup>

                        <FormGroup
                            helperText="The author(s) of the mod"
                            label="Author"
                            intent={errors.author && "danger"}
                        >
                            <Controller
                                name="author"
                                control={control}
                                rules={{required: true}}
                                render={({field}) => (
                                    <InputGroup
                                        {...field}
                                        placeholder="John Matrix"
                                        intent={errors.author && "danger"}
                                    />
                                )}
                            />
                        </FormGroup>

                        <FormGroup
                            helperText="The version of your mod - use semantic versioning (E.G. '1.2.4')"
                            label="Version"
                            intent={errors.version && "danger"}
                        >
                            <Controller
                                name="version"
                                control={control}
                                rules={{required: true}}
                                render={({field}) => (
                                    <InputGroup
                                        {...field}
                                        placeholder="0.0.1"
                                        intent={errors.version && "danger"}
                                    />
                                )}
                            />
                        </FormGroup>

                        <strong>{`After creating this mod - you can edit these settings by editing the 'mod.json' file in your mod`}</strong>
                    </DialogBody>

                    <DialogFooter
                        actions={
                            <Button
                                intent="primary"
                                type="submit"
                            >
                                Create Mod
                            </Button>
                        }
                    />
                </form>
            </Dialog>
        </div>
    )
}
