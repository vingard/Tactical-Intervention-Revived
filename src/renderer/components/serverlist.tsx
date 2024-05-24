import { Button, Card, NonIdealState, Section, SectionCard, Spinner } from "@blueprintjs/core";
import { useMemo } from "react";

export function ServerList({serverList, isLoading, onJoinServer}: {serverList?: any[], isLoading: boolean, onJoinServer: any}) {
    const validServers = useMemo(
        () => serverList &&
            serverList
            .filter((server: any) => server.query?.info?.game === "Tactical Intervention")
            .sort((a, b) => (a.query?.info?.players || 0) - (b.query?.info?.players || 0)) || [],
    [serverList])

    async function joinServer(ip: string) {
        const connecting = await window.electron.ipcRenderer.invoke("game:connectServer", ip)
        if (connecting) onJoinServer()
    }

    if (isLoading) {
        return (
            <div>
                <Spinner size={50}/>
            </div>
        )
    }

    return (
        <div style={{overflowX: "hidden", overflowY: "auto"}}>
            {validServers.map((server: any) => (
                <Section
                    key={server.id}
                    title={server.query.info.name}
                    subtitle={`${server.query.info.players}/${server.query.info.max_players} players on ${server.query.info.map}`}
                    rightElement={
                        <Button icon="play" onClick={(e) => {
                            e.stopPropagation()
                            joinServer(server.id)
                        }}>
                            Join
                        </Button>
                    }
                    collapsible
                    compact
                    collapseProps={{defaultIsOpen: false}}
                    style={{pointerEvents: "initial"}}
                >
                    <SectionCard>
                        <div className="serverList metadata">
                            <div>
                                <span>Host</span>{server.id}
                            </div>

                            <div>
                                <span>Map</span>{server.query.info.map}
                            </div>

                            {typeof server.query.meta?.mods === "object" && Object.keys(server.query.meta.mods).length > 0 && (
                                <div>
                                    <span>Mods</span>{`${Object.keys(server.query.meta.mods).join(",")}`}
                                </div>
                            )}

                            <div>
                                <span>Players</span>{`${server.query.info.players}/${server.query.info.max_players}`}
                            </div>

                            {server.query.info.players !== 0 && (
                                <Card style={{margin: "2px", padding: "0.4rem"}}>
                                    <div style={{}}>
                                        {server.query.players.map((ply: any) => (
                                            <span>{`${ply.name} - ${ply.score}`}</span>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>
                    </SectionCard>
                </Section>
            ))}

            {validServers.length === 0 && (
                <div>
                    <NonIdealState icon="offline" title="No servers found" description="If you know the IP of the server you want to connect to, try using 'Connect via IP', otherwise, you could host your own!"/>
                </div>
            )}
        </div>
    )
}
