import { ReactNode, createContext, useEffect, useState } from "react"

export interface GameContextProps {
    gameInfo?: any
    checkGameState?: any
}

export const GameContext = createContext<GameContextProps>({})

export function GameProvider({children}: {children?: ReactNode}) {
    const [gameInfo, setGameInfo] = useState({})

    async function checkGameState() {
        const isInstalled = await window.electron.ipcRenderer.invoke("game:checkState")
        setGameInfo({...gameInfo, ...{gameInstalled: isInstalled}})
        console.log("IS INSTALLED:", isInstalled)
    }

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
