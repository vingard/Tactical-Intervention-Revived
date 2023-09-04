import { Button, ButtonGroup, Dialog, DialogBody, DialogFooter, H6, Menu, MenuItem, NonIdealState, Popover, Section, SectionCard, Tag } from "@blueprintjs/core"
import { useEffect, useState } from "react"
import { WorkerDialog } from "./worker_dialog"

function ModDropdown({mod}: {mod: any}) {
    const [deleting, setDeleting] = useState(false)
    const [deletePopup, setDeletePopup] = useState(false)
    const loadingStateId = `mod_${mod.name}`

    async function deleteMod() {
        setDeleting(true)
        const success = await window.electron.ipcRenderer.invoke("mod:delete", mod.name)
        if (success) setDeleting(false)
    }

    console.log(deletePopup)

    return (
        <>
            <Popover
                content={
                    <Menu>
                        <MenuItem icon="refresh" text="Check for updates" onClick={() => (window.electron.ipcRenderer.invoke("mod:checkForUpdate"))}/>
                        <MenuItem icon="share" text="Open GitHub page" onClick={() => (window.electron.ipcRenderer.invoke("mod:openRemoteURL", mod.name))}/>
                        <MenuItem icon="folder-shared-open" text="Open mod directory" onClick={() => (window.electron.ipcRenderer.invoke("mod:openDirectory", mod.name))}/>
                        <MenuItem icon="trash" text="Delete" intent="danger" onClick={() => setDeletePopup(true)}/>
                    </Menu>
                }
                placement="bottom-end"
            >
                <Button icon="caret-down"/>
            </Popover>

            <WorkerDialog
                open={deleting}
                title={`Deleting ${mod.prettyName || mod.name}`}
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
                    Are you sure you want to delete {mod.prettyName || mod.name}?
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
    const [mods, setMods] = useState({})
    const [mounting, setMounting] = useState(false)
    const [workerTitle, setWorkerTitle] = useState("")
    const [loadingStateId, setLoadingStateId] = useState("")

    useEffect(() => {
        window.electron.ipcRenderer.on("mod:setState", (modData: any) => {
            setMods({...mods, ...{[modData.name]: modData}})
        })

        window.electron.ipcRenderer.on("mod:setDeleted", (modName: any) => {
            const temp: any = {...mods}
            delete temp[modName]

            setMods(temp)
        })

        window.electron.ipcRenderer.invoke("mod:init")
    }, [])


    async function setModMounted(mod: any, isMounted: boolean) {
        setWorkerTitle(`${isMounted && "Mounting" || "Un-Mounting"} ${mod.prettyName || mod.name}`)
        setLoadingStateId(`mod_${mod.name}`)
        setMounting(true)
        const success = await window.electron.ipcRenderer.invoke("mod:setMounted", mod.name, isMounted)
        if (success) setMounting(false)
    }

    const modsArray = Object.values(mods)

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
                {modsArray.length === 0 && (
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
                    {modsArray.map((mod) => (
                        <SectionCard key={mod.name} style={{padding: "0.5rem", paddingLeft: "1rem"}}>
                            <div className="">
                                <div style={{float: "right", margin: "1rem"}}>
                                    <ButtonGroup style={{float: "right"}}>
                                        {mod.needsUpdate && <Button icon="cloud-download" intent="primary">Update</Button>}
                                        <Button icon={mod.mounted && "switch" || "one-to-one"} onClick={() => (setModMounted(mod, !mod.mounted))}>{mod.mounted && "Un-Mount" || "Mount"}</Button>
                                        <ModDropdown mod={mod}/>
                                    </ButtonGroup>
                                </div>

                                <H6 style={{marginBottom: "0.1rem"}}>{mod.prettyName || mod.name}</H6>
                                <p className="muted" style={{marginTop: "0", marginBottom: "0.2rem"}}>
                                    {mod.version}
                                </p>
                                <Tag minimal intent={mod.mounted && "success" || "danger"}>{mod.mounted && "Mounted" || "Un-mounted"}</Tag>
                                {mod.needsUpdate && <Tag minimal intent="warning">Update Available (latest: 2.0.1)</Tag>}
                            </div>
                        </SectionCard>
                    ))}
                </Section>
            </div>
        </>
    )
}
