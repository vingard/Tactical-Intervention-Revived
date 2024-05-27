import { ProgressBar } from "@blueprintjs/core"
import { useEffect, useState } from "react"

export function LoadingBar({loadStateId, useProgress = true, usePercent = true, idle = false, onCompleted, onError}: {loadStateId: string, useProgress?: boolean, usePercent?: boolean, idle?: boolean, onCompleted?: () => void, onError?: () => void}) {
    const [loaderInfo, setLoaderInfo]: any = useState({})

    useEffect(() => {
        window.electron.ipcRenderer.on("loading:setState", (inboundKey: any, completedItems, totalItems, message, success) => {
            if (loadStateId !== inboundKey) return
            setLoaderInfo({...loaderInfo, ...{completedItems, totalItems, message, success}})
        })

        window.electron.ipcRenderer.on("loading:setError", (inboundKey: any, error) => {
            if (loadStateId !== inboundKey) return
            setLoaderInfo({...loaderInfo, ...{failed: true, error}})
            if (onError) onError()
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

    if (idle) {
        return (
            <ProgressBar intent="none" animate={false} value={0}/>
        )
    }

    // add the total onto the end... if it exists
    let exactProgress = ""
    if (loaderInfo.completedItems && Number.isFinite(loaderInfo.completedItems) && loaderInfo.totalItems > 1) exactProgress += `${loaderInfo.completedItems}`
    if (loaderInfo.totalItems && Number.isFinite(loaderInfo.totalItems) && loaderInfo.totalItems > 1) exactProgress += `/${loaderInfo.totalItems}`

    return (
        <div className="installer progressInfo">
            <ProgressBar intent={loaderInfo.error && "danger" || (loaderInfo.success && "success" || "primary")} animate={isWorking} value={progress}/>
            <p style={{color: loaderInfo.error && "#EB6847"}}>
                {loaderInfo.error || (loaderInfo.message || "Working...")}
                {(usePercent && progress && Number.isFinite(progress)) && ` - ${Math.floor(progress * 100)}%`}
                {(useProgress && progress) && exactProgress !== "" && ` (${exactProgress})`}
            </p>
        </div>
    )
}
