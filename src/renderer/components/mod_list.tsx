import { Button, ButtonGroup, Dialog, DialogBody, DialogFooter, H6, Menu, MenuItem, NonIdealState, Popover, Section, SectionCard, Tag } from "@blueprintjs/core"
import { useEffect, useState } from "react"
import { WorkerDialog } from "./worker_dialog"

function ModDropdown({mod}: {mod: any}) {
    const [deleting, setDeleting] = useState(false)
    const [deletePopup, setDeletePopup] = useState(false)
    const loadingStateId = `mod_${mod.uid}`

    async function deleteMod() {
        setDeleting(true)
        const success = await window.electron.ipcRenderer.invoke("mod:delete", mod.uid)
        if (success) setDeleting(false)
    }

    console.log(deletePopup)

    return (
        <>
            <Popover
                content={
                    <Menu>
                        <MenuItem icon="refresh" text="Check for updates" onClick={() => (window.electron.ipcRenderer.invoke("mod:checkForUpdate"))}/>
                        {mod.url && <MenuItem icon="share" text="Open GitHub page" onClick={() => (window.electron.ipcRenderer.invoke("mod:openRemoteURL", mod.uid))}/>}
                        <MenuItem icon="folder-shared-open" text="Open mod directory" onClick={() => (window.electron.ipcRenderer.invoke("mod:openDirectory", mod.uid))}/>
                        <MenuItem icon="trash" text="Delete" intent="danger" onClick={() => setDeletePopup(true)}/>
                    </Menu>
                }
                placement="bottom-end"
            >
                <Button icon="caret-down"/>
            </Popover>

            <WorkerDialog
                open={deleting}
                title={`Deleting ${mod.name || mod.uid}`}
                icon="trash"
                loadingStateId={loadingStateId}
                onClosed={() => setDeleting(false)}
            />

            <Dialog
                className="bp5-dark"
                title="Confirm Deletion"
                icon="trash"
                isOpen={deletePopup}
                onClose={() => setDeletePopup(false)}
            >
                <DialogBody>
                    Are you sure you want to delete {mod.name || mod.uid}?
                </DialogBody>

                <DialogFooter actions={(
                    <>
                        <Button onClick={() => setDeletePopup(false)}>
                            Cancel
                        </Button>
                        <Button intent="danger" onClick={() => deleteMod()}>
                            Delete
                        </Button>
                    </>
                )}/>
            </Dialog>
        </>
    )
}

export function ModList() {
    const [mods, setMods] = useState([])
    const [mounting, setMounting] = useState(false)
    const [workerTitle, setWorkerTitle] = useState("")
    const [loadingStateId, setLoadingStateId] = useState("")

    useEffect(() => {
        window.electron.ipcRenderer.on("mod:setState", (allMods: any) => {
            setMods(allMods)
        })

        window.electron.ipcRenderer.invoke("mod:init")
    }, [])


    async function setModMounted(mod: any, isMounted: boolean) {
        setWorkerTitle(`${isMounted && "Mounting" || "Un-Mounting"} ${mod.name || mod.uid}`)
        setLoadingStateId(`mod_${mod.uid}`)
        setMounting(true)
        const success = await window.electron.ipcRenderer.invoke("mod:setMounted", mod.uid, isMounted)
        if (success) setMounting(false)
    }

    return (
        <>
            {loadingStateId !== "" && <WorkerDialog
                open={mounting}
                title={workerTitle}
                icon="cloud-download"
                loadingStateId={loadingStateId}
                onClosed={() => setMounting(false)}
            />}

            <div className="modList container">
                {mods.length === 0 && (
                    <div className="modList noMods">
                        <NonIdealState
                            icon="heart-broken"
                            title="No mods installed"
                        >
                            {`When you download a mod it'll show up here.`}
                        </NonIdealState>
                    </div>
                )}

                <Section compact>
                    {mods.map((mod: any) => (
                        <SectionCard key={mod.uid} style={{padding: "0.5rem", paddingLeft: "1rem"}}>
                            <div className="">
                                <div style={{float: "right", margin: "1rem"}}>
                                    <ButtonGroup style={{float: "right"}}>
                                        {mod.needsUpdate && <Button icon="cloud-download" intent="primary">Update</Button>}
                                        <Button icon={mod.mounted && "switch" || "one-to-one"} onClick={() => (setModMounted(mod, !mod.mounted))}>{mod.mounted && "Un-Mount" || "Mount"}</Button>
                                        <ModDropdown mod={mod}/>
                                    </ButtonGroup>
                                </div>

                                <H6 style={{marginBottom: "0.1rem"}}>{mod.name || mod.uid}</H6>
                                <p className="muted" style={{marginTop: "0", marginBottom: "0.2rem"}}>
                                    {mod.version}
                                </p>
                                <div style={{display: "flex", gap: "0.2rem"}}>
                                    <Tag minimal intent={mod.mounted && "success" || "danger"}>{mod.mounted && "Mounted" || "Un-mounted"}</Tag>

                                    {mod.needsUpdate && <Tag minimal intent="warning">Update Available (latest: 2.0.1)</Tag>}
                                    {!mod.url && <Tag minimal intent="primary">Local Mod</Tag>}
                                </div>
                            </div>
                        </SectionCard>
                    ))}
                </Section>
            </div>
        </>
    )
}
