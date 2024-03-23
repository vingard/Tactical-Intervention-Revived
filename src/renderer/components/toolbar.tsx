import { Button, ButtonGroup, Card, Classes, ContextMenu, Divider, Menu, MenuDivider, MenuItem, Popover } from "@blueprintjs/core"
import { useState } from "react"
import { ConnectDialog } from "./connect_dialog"
import { SettingsDialog } from "./settings_dialog"
import { AddModDialog } from "./add_mod_dialog"
import { LoadoutDialog } from "./loadout_dialog"
import { NewModDialog } from "./new_mod_dialog"
import { ServerBrowserDialog } from "./serverbrowser_dialog"

function PlayDropdown() {
    return (
        <Menu>
            <MenuItem icon="play" text="Play Offline" onClick={() => (window.electron.ipcRenderer.invoke("game:start"))}/>
            <MenuItem icon="wrench" text="Start Map Kit" onClick={() => (window.electron.ipcRenderer.invoke("game:startDevTools"))}/>
        </Menu>
    )
}

function AddModDropdown({onAddModFromFolder, onCreateNewMod}: {onAddModFromFolder: any, onCreateNewMod: any}) {
    return (
        <Menu>
            <MenuItem icon="folder-open" text="Add mod from folder" onClick={() => onAddModFromFolder()}/>
            <MenuItem icon="new-object" text="Create new mod" onClick={() => onCreateNewMod()}/>
        </Menu>
    )
}

async function addModFromFolder() {
    await window.electron.ipcRenderer.invoke("mod:installFromFolder")
}

export function Toolbar() {
    const [openPopup, setOpenPopup] = useState("")
    const [playDropdownOpen, setPlayDropdownOpen] = useState(false)

    return (
        <>
            <div className="toolbar container">
                <Card>
                    <ButtonGroup>
                        {/* <Button>
                            <img src={icon} alt="" width="40"/>
                        </Button> */}

                        <ButtonGroup>
                            <Button large icon="add" onClick={() => setOpenPopup("mod_add")}>Add Mod</Button>
                            <Popover content={<AddModDropdown onAddModFromFolder={() => addModFromFolder()} onCreateNewMod={() => setOpenPopup("mod_new")}/>} placement="bottom-end">
                                <Button icon="caret-down"/>
                            </Popover>
                        </ButtonGroup>
                    </ButtonGroup>

                    <div className="toolbar play">
                        <ButtonGroup>
                            <Button icon="ammunition" onClick={() => setOpenPopup("loadout")}>Loadout</Button>
                            <Button icon="cog" onClick={() => setOpenPopup("settings")}>Settings</Button>
                            <Divider/>
                            <Button intent="primary" icon="play" large onClick={() => setOpenPopup("server_browser")}>
                                Play
                            </Button>
                            <Popover content={<PlayDropdown/>} placement="bottom-end">
                                <Button intent="primary" icon="caret-down"/>
                            </Popover>
                        </ButtonGroup>
                    </div>
                </Card>
            </div>

            <SettingsDialog open={openPopup === "settings"} onClosed={() => setOpenPopup("")}/>
            <ServerBrowserDialog
                open={openPopup === "server_browser"}
                onClosed={() => setOpenPopup("")}
                onSelectIPConnect={() => setOpenPopup("connect")}
            />
            <ConnectDialog open={openPopup === "connect"} onClosed={() => setOpenPopup("")}/>
            <AddModDialog open={openPopup === "mod_add"} onClosed={() => setOpenPopup("")}/>
            <NewModDialog open={openPopup === "mod_new"} onClosed={() => setOpenPopup("")}/>
            <LoadoutDialog open={openPopup === "loadout"} onClosed={() => setOpenPopup("")}/>
        </>
    )
}
