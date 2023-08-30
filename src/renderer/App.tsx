import { MemoryRouter as Router, Routes, Route } from "react-router-dom"
import { Button, Classes } from "@blueprintjs/core"
import "./App.css"
import { useState } from "react"
import classNames from "classnames"
import { LauncherPage } from "./pages/launcher"
import { GameProvider } from "./providers/game.provider"

export default function App() {
    const [darkTheme, setDarkTheme] = useState(true)

    return (
        <div className={classNames("app", {
                [Classes.DARK]: darkTheme
            })}
        >
            <GameProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<LauncherPage/>}/>
                    </Routes>
                </Router>
            </GameProvider>
        </div>
    )
}
