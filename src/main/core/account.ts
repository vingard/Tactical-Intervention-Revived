import { BrowserWindow, dialog, shell } from "electron";
import { jwtDecode } from "jwt-decode";
import { API } from "./api";
import { storeSet } from "./store";

// TODO: https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app
// 1 open login in browser
// 2 redirect to tacint-revived://login/45454454
// 3 forward that to the callback url

const PROTOCOL_LOGIN_ENDPOINT = "tacint-revived://login/"

let activeAuthToken: string | undefined

interface JWTPayload {
    id: string
    username: string
    iat: string
    exp: string
}

export function getUser() {
    if (!activeAuthToken) return

    return {
        accessToken: activeAuthToken,
        info: jwtDecode<JWTPayload>(activeAuthToken)
    }
}

export function checkLoggedIn() {
    const user = getUser()

    console.log(user)
    if (!user?.accessToken) return false

    return true
}

export function promptLogin() {
    const params = new URLSearchParams({
        redirectProxy: `${API.defaults.baseURL}/auth/callback_launcher`
    })

    const loginUrl = `${API.defaults.baseURL}/auth/login?${params.toString()}`
    shell.openExternal(loginUrl)
}

export async function login(loginToken: string) {
    console.log("logincall", loginToken)
    // TODO: eror handle
    let resp

    try {
        resp = await API.get("auth/callback", {
            params: {
                code: loginToken,
                launcher: true
            }
        })
    } catch(ex: any) {
        console.log(ex.response.data?.message)
        return
    }


    const accessToken = resp.data.access_token
    if (!accessToken) return

    activeAuthToken = accessToken
    storeSet("token", accessToken, true)

    console.log("loginCheck", checkLoggedIn())
}

export function logout() {

}

export function handleProtocol(commandLine: string[]) {
    // the commandLine is array of strings in which last element is deep link url
    const protocolUrl = commandLine.pop()
    const host = protocolUrl?.startsWith(PROTOCOL_LOGIN_ENDPOINT)
    if (!host) return

    console.log(protocolUrl)

    const paramStr = protocolUrl?.substring(PROTOCOL_LOGIN_ENDPOINT.length)
    const protocol = new URLSearchParams(paramStr)
    const code = protocol.get("code")

    if (!code || code === "undefined") return

    login(code)
}
