import { Button, Card, NonIdealState, Section, SectionCard, Spinner } from "@blueprintjs/core";
import { useMemo } from "react";

export function ServerList({serverList, isLoading, onJoinServer}: {serverList?: any[], isLoading: boolean, onJoinServer: any}) {
    const validServers = useMemo(
        () => serverList &&
            serverList
            .filter((server: any) => server.query?.info?.game === "Tactical Intervention")
            .sort((a, b) => (b.query?.info?.players || 0) - (a.query?.info?.players || 0)) || [],
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

    const testPlayers = [
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 },
        { name: "Test player", score: 4590 }
    ]

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
                                    <span>Mods</span>{`${Object.keys(server.query.meta.mods).length}`}
                                </div>
                            )}

                            <div>
                                <span>Players</span>{`${server.query.info.players}/${server.query.info.max_players}`}
                            </div>

                            {server.query.info.players !== 0 && (
                                <Card style={{margin: "2px", padding: "0.4rem"}}>
                                    <ul className="serverList playersGrid">
                                        {((server.query.players || []) as any[]).sort((a, b) => b.score - a.score).map((ply: any) => (
                                            <li className="serverList playersGridItem"><b>{`${ply.name}`}</b>{` - ${ply.score} kills`}</li>
                                        ))}
                                    </ul>
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
