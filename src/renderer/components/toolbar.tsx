import { Button, ButtonGroup, Classes, ContextMenu, Divider, Menu, MenuDivider, MenuItem, Popover } from "@blueprintjs/core"
import { useState } from "react"
import { ConnectDialog } from "./connect_dialog"

function PlayDropdown() {
    return (
        <Menu>
            <MenuItem icon="play" text="Play Offline" onClick={() => (window.electron.ipcRenderer.invoke("game:start"))}/>
            <MenuItem icon="map-create" text="Start Hammer Level Editor"/>
        </Menu>
    )
}

export function Toolbar() {
    const [connectPopup, setConnectPopup] = useState(false)
    const [playDropdownOpen, setPlayDropdownOpen] = useState(false)

    function doPlay() {
        setConnectPopup(true)
    }

    return (
        <>
            <div className="toolbar container">
                <ButtonGroup>
                    {/* <Button>
                        <img src={icon} alt="" width="40"/>
                    </Button> */}

                    <Button icon="add">Add mod</Button>
                    <Button icon="updated">Update all mods</Button>
                    <Divider/>
                    <Button icon="git-merge">Remount all</Button>
                </ButtonGroup>

                <div className="toolbar play">
                    <ButtonGroup>
                        <Button icon="cog">Settings</Button>
                        <Divider/>
                        <Button intent="primary" icon="play" large onClick={() => doPlay()}>
                            Play
                        </Button>
                        <Popover content={<PlayDropdown/>} placement="bottom-end">
                            <Button intent="primary" icon="caret-down"/>
                        </Popover>
                    </ButtonGroup>
                </div>
            </div>

            <ConnectDialog open={connectPopup} onClosed={() => setConnectPopup(false)}/>
        </>
    )
}
