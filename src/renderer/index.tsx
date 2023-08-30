import { createRoot } from "react-dom/client"

import "normalize.css"
import "@blueprintjs/core/lib/css/blueprint.css"
import "@blueprintjs/icons/lib/css/blueprint-icons.css"
import "@blueprintjs/select/lib/css/blueprint-select.css"

import { FocusStyleManager } from "@blueprintjs/core"
import App from "./App"

FocusStyleManager.onlyShowFocusOnTabs()

const container = document.getElementById("root") as HTMLElement
const root = createRoot(container)
root.render(<App />)
