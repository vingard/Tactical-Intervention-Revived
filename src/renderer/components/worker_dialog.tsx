import { Dialog, DialogBody, MaybeElement } from "@blueprintjs/core"
import { useState } from "react"
import { LoadingBar } from "./loadingbar"

export function WorkerDialog({open, onClosed, loadingStateId, title, icon, autoClose = false}: {open: boolean, onClosed?: any, loadingStateId: string, title: string, icon: string, autoClose?: boolean}) {
    const [working, setWorking] = useState(true)

    function onWorkCompeleted() {
        setWorking(false)
        if (autoClose && onClosed) onClosed()
    }

    return (
        <div>
            <Dialog
                isOpen={open}
                onClose={onClosed}
                className="bp5-dark"
                title={title}
                icon={icon}
                isCloseButtonShown={!working}
                canOutsideClickClose={false}
                canEscapeKeyClose={false}
            >
                <DialogBody>
                    <LoadingBar
                        loadStateId={loadingStateId}
                        onCompleted={() => onWorkCompeleted()}
                        onError={() => setWorking(false)}
                    />
                </DialogBody>
            </Dialog>
        </div>
    )
}
