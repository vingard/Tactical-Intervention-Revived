import { Button, Dialog, DialogBody, DialogFooter, Section, SectionCard } from "@blueprintjs/core"
import { ipcRenderer } from "electron"
import { useEffect, useRef, useState } from "react"

export function ServerBrowserDialog({open, onClosed, onSelectIPConnect}: {open: boolean, onClosed: any, onSelectIPConnect: any}) {
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
                    {serverList.filter((server: any) => server.query !== undefined).map((server: any) => (
                        <Section
                            key={server.id}
                            title={server.query.info.name}
                            subtitle={`${server.query.info.players}/${server.query.info.max_players} players on ${server.query.info.map}`}
                            rightElement={
                                <Button>
                                    Connect
                                </Button>
                            }
                            collapsible
                            compact
                        >
                            <SectionCard>
                                <div className="serverList metadata">
                                    <div>
                                        <span>Map</span>{server.query.info.map}
                                    </div>
                                    <div>
                                        <span>Players</span>{`${server.query.info.players}/${server.query.info.max_players}`}
                                    </div>

                                    {server.query.players.map((ply: any) => (
                                        <span>{`${ply.name} - ${ply.score}`}</span>
                                    ))}
                                </div>
                            </SectionCard>
                        </Section>
                    ))}

                </DialogBody>

                <DialogFooter
                    actions={
                        <>
                            <Button>
                                Create Server
                            </Button>

                            <Button onClick={onSelectIPConnect}>
                                Connect via IP
                            </Button>

                            <Button
                                intent="primary"
                                type="submit"
                                disabled={false}
                            >
                                Connect
                            </Button>
                        </>
                    }
                />
            </Dialog>
        </div>
    )
}
