import { ProgressBar } from "@blueprintjs/core";
import { useEffect, useState } from "react";

export function LoadingBar({loadStateId, useProgress = true, usePercent = true}: {loadStateId: string, useProgress?: boolean, usePercent?: boolean}) {
    const [loaderInfo, setLoaderInfo]: any = useState({})

    useEffect(() => {
        window.electron.ipcRenderer.on("loading:setState", (inboundKey: any, completedItems, totalItems, message) => {
            if (loadStateId !== inboundKey) return

            setLoaderInfo({...loaderInfo, ...{completedItems, totalItems, message}})
        })

        window.electron.ipcRenderer.on("loading:setError", (inboundKey: any, error) => {
            if (loadStateId !== inboundKey) return

            setLoaderInfo({...loaderInfo, ...{error}})
        })

        window.electron.ipcRenderer.on("loading:reset", (inboundKey: any) => {
            if (loadStateId !== inboundKey) return

            setLoaderInfo({})
        })
    }, [])

    let progress

    if (loaderInfo.completedItems && loaderInfo.totalItems) {
        progress = loaderInfo.completedItems / loaderInfo.totalItems

        if (loaderInfo.totalItems === 1 && loaderInfo.completedItems <= 1) useProgress = false
    }

    const isWorking = !loaderInfo.error && progress !== 1

    return (
        <div className="installer progressInfo">
            <ProgressBar intent={loaderInfo.error && "danger" || (progress === 1 && "success" || "primary")} animate={isWorking} value={progress}/>
            <p style={{color: loaderInfo.error && "#EB6847"}}>
                {loaderInfo.error || (loaderInfo.message || "Working...")}
                {(usePercent && progress) && ` - ${Math.floor(progress * 100)}%`}
                {(useProgress && progress) && ` (${loaderInfo.completedItems}/${loaderInfo.totalItems})`}
            </p>
        </div>
    )
}
