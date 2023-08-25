import { Button, ButtonGroup, Divider } from "@blueprintjs/core"

export function Toolbar() {
    return (
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
                    <Button intent="primary" icon="play" large>
                        Play
                    </Button>
                    <Button intent="primary" icon="caret-down"/>
                </ButtonGroup>
            </div>
        </div>

    )
}
