import { safeStorage } from "electron"
import { Store } from "../classes/store"

const store: any = new Store()

export function storeSet(key: string, value: any, encrypt = false) {
    store.set(key, (encrypt && safeStorage.encryptString(value) || value))
}

export function storeGet(key: string, decrypt = false) {
    return decrypt && safeStorage.decryptString(store.get(key)) || store.get(key)
}

export function storeRemove(key: string) {
    store.delete(key)
}
