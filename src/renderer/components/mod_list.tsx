import { Button, ButtonGroup, Dialog, DialogBody, DialogFooter, H6, Menu, MenuItem, NonIdealState, Popover, Section, SectionCard, Tag, Tooltip } from "@blueprintjs/core"
import { useCallback, useEffect, useState } from "react"
import { DragDropContext, Droppable, Draggable, DropResult, ResponderProvided } from "react-beautiful-dnd"
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

    return (
        <>
            <Popover
                content={
                    <Menu>
                        <MenuItem icon="automatic-updates" text="Check for updates" onClick={() => (window.electron.ipcRenderer.invoke("mod:checkForUpdate"))}/>
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
    const [mods, setMods] = useState<any[]>([])
    const [mounting, setMounting] = useState(false)
    const [workerTitle, setWorkerTitle] = useState("")
    const [loadingStateId, setLoadingStateId] = useState("")

    useEffect(() => {
        window.electron.ipcRenderer.on("mod:setState", (allMods: any) => {
            const sortedMods = allMods.sort((a: any, b: any) => ((a.priority || 0) < (b.priority || 0)) ? 1 : -1)
            setMods(sortedMods)
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

    async function syncMod(mod: any) {
        setWorkerTitle(`Syncing ${mod.name || mod.uid} with local content`)
        setLoadingStateId(`mod_${mod.uid}`)
        setMounting(true)
        const success = await window.electron.ipcRenderer.invoke("mod:sync", mod.uid)
        if (success) setMounting(false)
    }

    function reorder(list: any, startIndex: number, endIndex: number) {
        const result = Array.from(list)
        const [removed] = result.splice(startIndex, 1)
        result.splice(endIndex, 0, removed)

        return result
    }

    const onDragEnd = useCallback(async (result: DropResult, provided: ResponderProvided) => {
        if (!result.destination) return

        const items: any = reorder(
            mods,
            result.source.index,
            result.destination.index
        )

        const goingDown = result.source.index < result.destination.index
        console.log("goingDown", goingDown)
        const mod = items[result.destination.index]
        const lastMod = items[result.destination.index + (goingDown && -1 || 1)]
        const priority = (lastMod?.priority || 0) + (goingDown && -1 || 1)

        console.log(`setting priority for ${mod.name} ${mod.uid} to ${priority}`)

        setMods(items)
        setWorkerTitle(`Re-mounting ${mod.name || mod.uid}`)
        setLoadingStateId(`mod_${mod.uid}`)
        setMounting(true)
        const success = await window.electron.ipcRenderer.invoke("mod:setPriority", mod.uid, priority)
        if (success) setMounting(false)
    }, [mods, setMods])

    return (
        <div className="modList container">
            {loadingStateId !== "" && <WorkerDialog
                open={mounting}
                title={workerTitle}
                icon="cloud-download"
                loadingStateId={loadingStateId}
                onClosed={() => setMounting(false)}
            />}

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
                {/** eslint-disable-next-line react/jsx-no-bind */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="droppable">
                        {(provided, snapshot) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                style={{
                                    // background: snapshot.isDraggingOver && "lightblue" || undefined,
                                    //opacity: snapshot.isDraggingOver && 0.1 || undefined,
                                    background: snapshot.isDraggingOver && "rgba(200, 200, 200, 0.05)" || undefined,
                                    padding: "grid"
                                }}
                            >
                                {mods.map((mod: any, index) => (
                                    <Draggable key={mod.uid} draggableId={mod.uid} index={index}>
                                        {(modProvided, modSnapshot) => (
                                            <SectionCard
                                                key={mod.uid}
                                                ref={modProvided.innerRef}
                                                padded={false}
                                                {...modProvided.draggableProps}
                                            >
                                                <div style={{
                                                    background: modSnapshot.isDragging && "rgba(255, 255, 255, 0.1)" || undefined,
                                                    opacity: modSnapshot.isDragging && 0.5 || undefined,
                                                    padding: "0.5rem",
                                                    paddingLeft: "0.2rem",
                                                    display: "flex",
                                                    alignItems: "center"
                                                }}>
                                                    <div style={{verticalAlign: "middle", padding: "0.1rem"}}>
                                                        <Tooltip content="Drag the mod up or down the list to adjust the load order" compact className="bp5-dark">
                                                            <Button
                                                                minimal
                                                                icon="arrows-vertical"
                                                                style={{opacity: 0.6}}
                                                                fill
                                                                small
                                                                {...modProvided.dragHandleProps}
                                                            />
                                                        </Tooltip>
                                                    </div>

                                                    <div>
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

                                                    <div style={{margin: "1rem", marginLeft: "auto"}}>
                                                        <ButtonGroup>
                                                            {mod.needsUpdate && <Button icon="cloud-download" intent="primary">Update</Button>}
                                                            {!mod.url && (
                                                                <Button
                                                                    icon="changes"
                                                                    onClick={() => (syncMod(mod))}
                                                                    disabled={!mod.mounted}
                                                                >
                                                                    Sync Files
                                                                </Button>
                                                            )}
                                                            <Button icon={mod.mounted && "switch" || "one-to-one"} onClick={() => (setModMounted(mod, !mod.mounted))}>{mod.mounted && "Un-Mount" || "Mount"}</Button>
                                                            <ModDropdown mod={mod}/>
                                                        </ButtonGroup>
                                                    </div>
                                                </div>
                                            </SectionCard>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </Section>
        </div>
    )
}
