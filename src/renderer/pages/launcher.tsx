import { Callout, Card, NonIdealState } from "@blueprintjs/core";
import { GameInstaller } from "renderer/components/installer";
import { Toolbar } from "renderer/components/toolbar";

export function LauncherPage() {
    return (
        <div className="content">
            <GameInstaller/>
            <Card>
                <Toolbar/>
            </Card>

            <Callout title="Game not installed" intent="danger">
                Your game is not installed! Click here to install your game.
            </Callout>

            <div className="modList container">
                <div className="modList noMods">
                    <NonIdealState
                        icon="heart-broken"
                        title="No mods installed"
                    >
                        {`When you download a mod it'll show up here.`}
                    </NonIdealState>
                </div>
            </div>
        </div>
    )
}