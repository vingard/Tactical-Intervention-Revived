import { Card } from "@blueprintjs/core"
import { GameInstaller } from "renderer/components/installer"
import { ModList } from "renderer/components/mod_list"
import { Toolbar } from "renderer/components/toolbar"

export function LauncherPage() {
    return (
        <div className="content">
            <GameInstaller/>

            <Card>
                <Toolbar/>
            </Card>

            {/* <Callout title="Game not installed" intent="danger">
                Your game is not installed! Click here to install your game.
            </Callout> */}

            <ModList/>
        </div>
    )
}
