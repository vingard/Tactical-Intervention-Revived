import { Button, ButtonGroup, Classes, ContextMenu, Divider, Menu, MenuDivider, MenuItem, Popover } from "@blueprintjs/core"
import { useState } from "react"
import { ConnectDialog } from "./connect_dialog"
import { SettingsDialog } from "./settings_dialog"
import { AddModDialog } from "./add_mod_dialog"
import { WorkerDialog } from "./worker_dialog"

function PlayDropdown() {
    return (
        <Menu>
            <MenuItem icon="play" text="Play Offline" onClick={() => (window.electron.ipcRenderer.invoke("game:start"))}/>
            <MenuItem icon="code" text="Start Dev Tools" onClick={() => (window.electron.ipcRenderer.invoke("game:startDevTools"))}/>
        </Menu>
    )
}

export function Toolbar() {
    const [openPopup, setOpenPopup] = useState("")
    const [playDropdownOpen, setPlayDropdownOpen] = useState(false)

    return (
        <>
            <div className="toolbar container">
                <ButtonGroup large>
                    {/* <Button>
                        <img src={icon} alt="" width="40"/>
                    </Button> */}

                    <Button icon="add" onClick={() => setOpenPopup("mod_add")}>Add Mod</Button>
                    <Button icon="updated">Update Mods</Button>
                    <Divider/>
                    <Button icon="git-merge">Remount Mods</Button>
                </ButtonGroup>

                <div className="toolbar play">
                    <ButtonGroup>
                        <Button icon="cog" onClick={() => setOpenPopup("settings")}>Settings</Button>
                        <Divider/>
                        <Button intent="primary" icon="play" large onClick={() => setOpenPopup("connect")}>
                            Play
                        </Button>
                        <Popover content={<PlayDropdown/>} placement="bottom-end">
                            <Button intent="primary" icon="caret-down"/>
                        </Popover>
                    </ButtonGroup>
                </div>
            </div>

            <SettingsDialog open={openPopup === "settings"} onClosed={() => setOpenPopup("")}/>
            <ConnectDialog open={openPopup === "connect"} onClosed={() => setOpenPopup("")}/>
            <AddModDialog open={openPopup === "mod_add"} onClosed={() => setOpenPopup("")}/>
        </>
    )
}
