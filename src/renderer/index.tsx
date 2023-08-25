import { createRoot } from "react-dom/client"
import { FocusStyleManager } from "@blueprintjs/core"
import App from "./App"

FocusStyleManager.onlyShowFocusOnTabs()

const container = document.getElementById("root") as HTMLElement
const root = createRoot(container)
root.render(<App />)
