import { Button, Dialog, DialogBody, DialogFooter, Section, SectionCard } from "@blueprintjs/core"
import { ipcRenderer } from "electron"
import { useEffect, useRef, useState } from "react"
import { ServerList } from "./serverlist"

export function ServerBrowserDialog({open, onClosed, onSelectIPConnect, onSelectCreateServer}: {open: boolean, onClosed: any, onSelectIPConnect: any, onSelectCreateServer: any}) {
    const [serverList, setServerList] = useState([])
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState()

    async function loadServerList() {
        setLoading(true)
        const resp = await window.electron.ipcRenderer.invoke("game:getServerList")
        console.log("serverList", resp)
        setServerList(resp.servers)
        setStatus(resp.status)
        setLoading(false)
    }

    useEffect(() => {
        loadServerList()
    }, [open])

    return (
        <div>
            <Dialog
                isOpen={open}
                onClose={onClosed}
                className="bp5-dark"
                title="Server Browser"
                icon="third-party"
                canOutsideClickClose={false}
                style={{width: "56rem"}}
            >
                <DialogBody>
                    <ServerList serverList={serverList} isLoading={loading} onJoinServer={() => onClosed()}/>
                </DialogBody>

                <DialogFooter
                    actions={
                        <>
                            <Button icon="refresh" onClick={() => loadServerList()}>
                                Refresh
                            </Button>

                            <Button icon="globe-network" onClick={() => onSelectCreateServer()}>
                                Create Server
                            </Button>

                            <Button onClick={onSelectIPConnect} icon="arrow-up">
                                Connect via IP
                            </Button>

                            {/* <Button
                                intent="primary"
                                type="submit"
                                disabled={false}
                            >
                                Connect
                            </Button> */}
                        </>
                    }
                />
            </Dialog>
        </div>
    )
}
