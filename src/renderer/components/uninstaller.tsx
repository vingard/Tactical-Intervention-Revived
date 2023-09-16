import { Dialog } from "@blueprintjs/core"
import { useEffect, useState } from "react"
import { WorkerDialog } from "./worker_dialog"

export function GameUninstaller() {
    const [uninstalling, setUninstalling] = useState(false)

    useEffect(() => {
        window.electron.ipcRenderer.on("game:showUninstaller", () => {
            setUninstalling(true)
        })
    }, [setUninstalling])

    return (
        <WorkerDialog
            open={uninstalling}
            title="Uninstalling game"
            icon="trash"
            loadingStateId="game"
            onClosed={() => setUninstalling(false)}
        />
    )
}
