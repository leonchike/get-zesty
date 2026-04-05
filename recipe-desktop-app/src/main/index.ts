import { app, BrowserWindow, shell, ipcMain, safeStorage, powerSaveBlocker, Menu } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import { buildMenu } from './menu'

const store = new Store()

let mainWindow: BrowserWindow | null = null
let powerSaveId: number | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    vibrancy: 'sidebar',
    visualEffectState: 'active',
    backgroundColor: '#F9F6F1',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// --- IPC Handlers ---

// Secure token storage using OS keychain via safeStorage
ipcMain.handle('auth:store-token', (_event, token: string) => {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(token)
    store.set('auth-token', encrypted.toString('base64'))
    return true
  }
  // Fallback: store in plain (not ideal but functional)
  store.set('auth-token-plain', token)
  return true
})

ipcMain.handle('auth:get-token', () => {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = store.get('auth-token') as string | undefined
    if (!encrypted) return null
    try {
      return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    } catch {
      return null
    }
  }
  return (store.get('auth-token-plain') as string) || null
})

ipcMain.handle('auth:clear-token', () => {
  store.delete('auth-token')
  store.delete('auth-token-plain')
  return true
})

// User data storage (non-sensitive)
ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
  store.set(key, value)
  return true
})

ipcMain.handle('store:get', (_event, key: string) => {
  return store.get(key) ?? null
})

ipcMain.handle('store:delete', (_event, key: string) => {
  store.delete(key)
  return true
})

// Power save blocker for cooking mode
ipcMain.handle('power:prevent-sleep', () => {
  if (powerSaveId !== null) return powerSaveId
  powerSaveId = powerSaveBlocker.start('prevent-display-sleep')
  return powerSaveId
})

ipcMain.handle('power:allow-sleep', () => {
  if (powerSaveId !== null) {
    powerSaveBlocker.stop(powerSaveId)
    powerSaveId = null
  }
  return true
})

// Window controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.handle('window:close', () => mainWindow?.close())

// --- App Lifecycle ---

app.whenReady().then(() => {
  Menu.setApplicationMenu(buildMenu())
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
