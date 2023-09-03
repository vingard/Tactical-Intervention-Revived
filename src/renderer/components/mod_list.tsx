import { Button, ButtonGroup, H6, Menu, MenuItem, NonIdealState, Popover, Section, SectionCard, Tag } from "@blueprintjs/core"
import { useEffect, useState } from "react"
import { WorkerDialog } from "./worker_dialog"

function ModDropdown() {
    return (
        <Menu>
            <MenuItem icon="refresh" text="Check for updates" onClick={() => (window.electron.ipcRenderer.invoke("game:start"))}/>
            <MenuItem icon="share" text="Open GitHub page" onClick={() => (window.electron.ipcRenderer.invoke("game:startDevTools"))}/>
            <MenuItem icon="trash" text="Delete" intent="danger" onClick={() => (window.electron.ipcRenderer.invoke("game:startDevTools"))}/>
        </Menu>
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
    }, [])


    async function setModMounted(mod: any, isMounted: boolean) {
        setWorkerTitle(`${isMounted && "Mounting" || "Un-Mounting"} ${mod.prettyName || mod.name}`)
        setLoadingStateId(`mod_${mod.name}`)
        setMounting(true)
        const success = await window.electron.ipcRenderer.invoke("mod:setMounted", mod.name, isMounted)
        setMounting(false)
    }

    const modsArray = Object.values(mods)

    return (
        <>
            {loadingStateId !== "" && <WorkerDialog
                open={mounting}
                title={workerTitle}
                icon="cloud-download"
                loadingStateId={loadingStateId}
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

                                        <Popover content={<ModDropdown/>} placement="bottom-end">
                                            <Button icon="caret-down"/>
                                        </Popover>
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
