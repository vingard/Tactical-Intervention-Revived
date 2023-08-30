import { DialogBody, DialogStep, FormGroup, HTMLSelect, InputGroup, Switch } from "@blueprintjs/core"
import React, { useContext, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { GameContext } from "renderer/providers/game.provider"
import { LoadingBar } from "./loadingbar"
import { NoNavInputMultiStepDialog } from "./thirdparty/nonavmultistep"

function StartPanel() {
    return (
        <DialogBody>
            <div className="installer">
                <h2>Welcome to Tactical Intervention Revived!</h2>

                <div className="fade">
                    <p>
                        <b>The game is currently not installed, {`Before you can start playing you'll need to download the game files.`}</b>
                        <br/>The game will be installed to the same location as this program.
                    </p>

                    <p>Approximate size on disk: <b>5GB</b></p>
                </div>
            </div>
        </DialogBody>
    )
}

function StartStep() {
    return (
        <DialogStep
            id="start"
            title="Start"
            panel={<StartPanel/>}
            nextButtonProps={{
                disabled: false,
                text: "Start Download"
            }}
        />
    )
}

function DownloadPanel() {
    return (
        <DialogBody>
            <div className="installer">
                <h3>Downloading & Installing</h3>

                <div className="installer progressInfo">
                    <LoadingBar loadStateId="game"/>
                </div>

                <br/>
                <p>Please wait for the download and installation to complete. It may take a while depending on your internet connection speed. Do not close this program.</p>
            </div>
        </DialogBody>
    )
}

function DownloadStep({installed}: {installed: boolean}) {
    return (
        <DialogStep
            id="download"
            title="Download & Install"
            panel={<DownloadPanel/>}
            nextButtonProps={{
                disabled: !installed
            }}
        />
    )
}

function SetupPanel({form}: {form: any}) {
    const {register, handleSubmit, control, formState: {errors}} = form

    return (
        <DialogBody>
            <div className="installer">
                <div className="input small">
                    <h3>Setup your Preferences</h3>

                    <form>
                        <FormGroup
                            helperText="This will be your display name in online play"
                            label="Username"
                            labelInfo="(required)"
                            intent={errors.username && "danger"}
                        >
                            <Controller
                                name="username"
                                control={control}
                                rules={{required: true}}
                                render={({field}) => (
                                    <InputGroup
                                        {...field}
                                        placeholder="Username"
                                        intent={errors.username && "danger"}
                                    />
                                )}
                            />

                        </FormGroup>

                        <FormGroup
                            label="Gore Enabled"
                            intent={errors.goreEnabled && "danger"}
                        >
                            <Switch
                                intent={errors.goreEnabled && "danger"}
                                {...register("goreEnabled")}
                            />
                        </FormGroup>

                        <FormGroup
                            label="Add to Steam Library"
                            helperText="After finishing this install, you must restart Steam to see Tactical Intervention Revived in your library"
                            intent={errors.steamShortcut && "danger"}
                        >
                            <Switch
                                intent={errors.steamShortcut && "danger"}
                                {...register("steamShortcut")}
                            />
                        </FormGroup>

                        <FormGroup
                            label="FPS limit"
                            intent={errors.maxFps && "danger"}
                        >
                            <HTMLSelect intent={errors.maxFps && "danger"} {...register("maxFps")}>
                                <option value="60">60 FPS</option>
                                <option value="90">90 FPS</option>
                                <option value="120">120 FPS</option>
                                <option value="140">140 FPS</option>
                                <option value="240">240 FPS</option>
                            </HTMLSelect>
                        </FormGroup>
                    </form>

                    <div className="muted">
                        You can always change your preferences later in the {`'Settings'`} menu
                    </div>
                </div>
            </div>
        </DialogBody>
    )
}

function SetupStep({form}: {form: any}) {
    return (
        <DialogStep
            id="setup"
            title="Setup"
            panel={<SetupPanel form={form}/>}
            backButtonProps={{
                disabled: true
            }}
            nextButtonProps={{
                disabled: false
            }}
        />
    )
}

// eslint-disable-next-line react/require-default-props
export function GameInstaller() {
    const {gameInfo, checkGameState} = useContext(GameContext)
    const [installerOpen, setInstallerOpen] = useState(false)
    const [installerComplete, setInstallerComplete] = useState(false)
    const [installingGame, setInstallingGame] = useState(false)
    const [installSuccess, setInstallSuccess] = useState(false)
    const form = useForm({defaultValues: {
        goreEnabled: true,
        steamShortcut: true
    }})

    async function invokeInstall() {
        const success = await window.electron.ipcRenderer.invoke("game:startInstall")
        setInstallingGame(false)
        setInstallSuccess(success)
    }

    async function setupFormSubmit(data: any, event: any) {
        data.username = data.username.trim()
        const success = await window.electron.ipcRenderer.invoke("game:setStartConfig", data)
        if (!success) console.error(success)

        setInstallerOpen(false)
        setInstallerComplete(true)
        //checkGameState()
    }

    useEffect(() => {
        if (gameInfo.gameInstalled === false && !installerOpen && !installerComplete) {
            setInstallerOpen(true)
        }
    }, [gameInfo, installerOpen, installerComplete])

    return (
        <NoNavInputMultiStepDialog
            className="bp5-dark"
            icon="download"
            navigationPosition="top"
            nextButtonProps={{
                text: "Next"
            }}
            finalButtonProps={{
                text: "Finish",
                onClick: form.handleSubmit(setupFormSubmit)
            }}
            backButtonProps={{
                disabled: true
            }}
            title="Install the game"
            isOpen={installerOpen}
            isCloseButtonShown={false}
            onChange={(newStepId, lastStepId, event) => {
                if (newStepId === "download" && installingGame === false && installSuccess === false) {
                    setInstallingGame(true)
                    invokeInstall()
                }
            }}
        >
            {StartStep()}
            {DownloadStep({installed: installSuccess})}
            {SetupStep({form})}
        </NoNavInputMultiStepDialog>
    )
}
