import { Callout, DialogBody, DialogStep, FormGroup, HTMLSelect, InputGroup, MultistepDialog, ProgressBar, Radio, RadioGroup, Slider, Switch } from "@blueprintjs/core"
import React from "react"


interface DownloadPanelProps {
    //onChange:  (event: React.FormEvent<HTMLInputElement>) => void
}


function StartPanel(props: React.FC<DownloadPanelProps>) {
    return (
        <DialogBody>
            <div className="installer">
                <h2>Welcome to Tactical Intervention Revived!</h2>

                <p>
                    <b>The game is currently not installed, {`Before you can start playing you'll need to download the game files.`}</b>
                </p>
                <p>The game will be installed to the same location as this program.</p>
                <p>Approximate size on disk: <b>5GB</b></p>
            </div>
        </DialogBody>
    )
}

function DownloadPanel() {
    return (
        <DialogBody>
            <div className="installer">
                <h3>Downloading & Installing</h3>

                <div className="installer progressInfo">
                    <ProgressBar intent="primary" value={0.5}/>
                    <p>Extracting game content (60/454)</p>
                </div>

                <br/>
                <p>Please wait for the download and installation to complete. It may take a while depending on your internet connection speed. Do not close this program.</p>
            </div>
        </DialogBody>
    )
}

function SetupPanel() {
    return (
        <DialogBody>
            <div className="installer">
                <div className="input small">
                    <h3>Profile</h3>

                    <FormGroup
                        helperText="This will be your display name in online play"
                        label="Username"
                        labelInfo="(required)"
                    >
                        <InputGroup
                            placeholder="Username"
                        />
                    </FormGroup>

                    <h3>Preferences</h3>

                    <FormGroup
                        label="Gore Enabled"
                    >
                        <Switch
                            placeholder="Username"
                            defaultChecked
                        />
                    </FormGroup>

                    <FormGroup
                        label="FPS limit"
                    >
                        <HTMLSelect>
                            <option value="60">60 FPS</option>
                            <option value="90">90 FPS</option>
                            <option value="120">120 FPS</option>
                            <option value="140">140 FPS</option>
                            <option value="240">240 FPS</option>
                        </HTMLSelect>
                    </FormGroup>

                    <div className="muted">You can always change these later in the {`'Settings'`} menu.</div>
                </div>
            </div>
        </DialogBody>
    )
}


export function GameInstaller() {
    return (
        <MultistepDialog
            className="bp5-dark"
            icon="download"
            navigationPosition="top"
            nextButtonProps={{
                text: "Next"
            }}
            finalButtonProps={{
                text: "Finish",
                disabled: false,
                tooltipContent: "end"
            }}
            title="Install the game"
            isOpen={true}
            isCloseButtonShown={false}
        >
            <DialogStep
                id="start"
                title="Start"
                panel={<StartPanel/>}
                nextButtonProps={{
                    disabled: false,
                    text: "Start Download"
                }}
            />

            <DialogStep
                id="download"
                title="Download & Install"
                panel={<DownloadPanel/>}
            />

            <DialogStep
                id="setup"
                title="Setup"
                panel={<SetupPanel/>}
                backButtonProps={{
                    disabled: true
                }}
            />

            <DialogStep
                id="shortcuts"
                title="Shortcuts"
                panel={<StartPanel/>}
            />
        </MultistepDialog>
    )
}
