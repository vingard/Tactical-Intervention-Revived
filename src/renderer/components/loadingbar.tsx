import { ProgressBar } from "@blueprintjs/core"
import { useEffect, useState } from "react"

export function LoadingBar({loadStateId, useProgress = true, usePercent = true, idle = false, onCompleted, onError}: {loadStateId: string, useProgress?: boolean, usePercent?: boolean, idle?: boolean, onCompleted?: () => void, onError?: () => void}) {
    const [loaderInfo, setLoaderInfo]: any = useState({})

    useEffect(() => {
        window.electron.ipcRenderer.on("loading:setState", (inboundKey: any, completedItems, totalItems, message) => {
            if (loadStateId !== inboundKey) return
            setLoaderInfo({...loaderInfo, ...{completedItems, totalItems, message}})
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

        window.electron.ipcRenderer.on("loading:success", (inboundKey: any) => {
            if (loadStateId !== inboundKey) return
            setLoaderInfo({...loaderInfo, ...{success: true}})
            if (onCompleted) onCompleted()
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

    return (
        <div className="installer progressInfo">
            <ProgressBar intent={loaderInfo.error && "danger" || (loaderInfo.success && "success" || "primary")} animate={isWorking} value={progress}/>
            <p style={{color: loaderInfo.error && "#EB6847"}}>
                {loaderInfo.error || (loaderInfo.message || "Working...")}
                {(usePercent && progress) && ` - ${Math.floor(progress * 100)}%`}
                {(useProgress && progress) && ` (${loaderInfo.completedItems}/${loaderInfo.totalItems})`}
            </p>
        </div>
    )
}
