import { Button, Dialog, DialogBody, DialogFooter, NonIdealState, Section, SectionCard } from "@blueprintjs/core"
import { useEffect, useRef, useState } from "react"
import { ServerList } from "./serverlist"

const MESSAGE_RATE_LIMIT = "You have been rate-limited for making too many requests to the master server. Please wait a while before trying again."
const MESSAGE_OTHER = "Failed to contact the master server. Ensure you have a stable connection or try again later."

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
                    {status !== 200 && (
                        <div>
                            <NonIdealState icon="error" title="Error" description={status === 429 && MESSAGE_RATE_LIMIT || MESSAGE_OTHER}/>
                        </div>
                    ) || (
                        <ServerList serverList={serverList} isLoading={loading} onJoinServer={() => onClosed()}/>
                    )}
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
