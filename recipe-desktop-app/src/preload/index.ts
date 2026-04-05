import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Auth / secure token storage
  auth: {
    storeToken: (token: string): Promise<boolean> =>
      ipcRenderer.invoke('auth:store-token', token),
    getToken: (): Promise<string | null> =>
      ipcRenderer.invoke('auth:get-token'),
    clearToken: (): Promise<boolean> =>
      ipcRenderer.invoke('auth:clear-token')
  },

  // Generic key-value store (non-sensitive data like user profile, preferences)
  store: {
    set: (key: string, value: unknown): Promise<boolean> =>
      ipcRenderer.invoke('store:set', key, value),
    get: (key: string): Promise<unknown> =>
      ipcRenderer.invoke('store:get', key),
    delete: (key: string): Promise<boolean> =>
      ipcRenderer.invoke('store:delete', key)
  },

  // Power management (cooking mode)
  power: {
    preventSleep: (): Promise<number> =>
      ipcRenderer.invoke('power:prevent-sleep'),
    allowSleep: (): Promise<boolean> =>
      ipcRenderer.invoke('power:allow-sleep')
  },

  // Window controls
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('window:maximize'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close')
  },

  // Listen for main process navigation commands (menu shortcuts)
  onNavigate: (callback: (path: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, path: string): void => {
      callback(path)
    }
    ipcRenderer.on('navigate', handler)
    return () => ipcRenderer.removeListener('navigate', handler)
  },

  onFocusSearch: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('focus-search', handler)
    return () => ipcRenderer.removeListener('focus-search', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
