import { ReactNode, createContext, useEffect, useState } from "react"

export interface GameContextProps {
    gameInfo?: any
    checkGameState?: any
}

export const GameContext = createContext<GameContextProps>({})

export function GameProvider({children}: {children?: ReactNode}) {
    const [gameInfo, setGameInfo] = useState({})
    const [loaderInfo, setLoaderInfo] = useState({})

    async function checkGameState() {
        const isInstalled = await window.electron.ipcRenderer.invoke("game:checkState")
        setGameInfo({...gameInfo, ...{gameInstalled: isInstalled}})
        console.log("IS INSTALLED:", isInstalled)
    }

    window.electron.ipcRenderer.on("loading:setState", (event, key, completedItems, totalItems, message) => {
        console.log(key, completedItems, totalItems, message)
    })

    useEffect(() => {
        checkGameState()
    }, [])

    return (
        // eslint-disable-next-line react/jsx-no-constructed-context-values
        <GameContext.Provider value={{gameInfo, checkGameState}}>
            {children}
        </GameContext.Provider>
    )
}
