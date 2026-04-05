import { Menu, app, BrowserWindow } from 'electron'

export function buildMenu(): Menu {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              {
                label: 'Settings...',
                accelerator: 'Cmd+,',
                click: (): void => {
                  BrowserWindow.getFocusedWindow()?.webContents.send('navigate', '/settings')
                }
              },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Recipe',
          accelerator: 'CmdOrCtrl+N',
          click: (): void => {
            BrowserWindow.getFocusedWindow()?.webContents.send('navigate', '/recipes/create')
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Go',
      submenu: [
        {
          label: 'All Recipes',
          accelerator: 'CmdOrCtrl+1',
          click: (): void => {
            BrowserWindow.getFocusedWindow()?.webContents.send('navigate', '/')
          }
        },
        {
          label: 'Cookbooks',
          accelerator: 'CmdOrCtrl+2',
          click: (): void => {
            BrowserWindow.getFocusedWindow()?.webContents.send('navigate', '/cookbooks')
          }
        },
        {
          label: 'Groceries',
          accelerator: 'CmdOrCtrl+3',
          click: (): void => {
            BrowserWindow.getFocusedWindow()?.webContents.send('navigate', '/groceries')
          }
        },
        { type: 'separator' },
        {
          label: 'Search',
          accelerator: 'CmdOrCtrl+F',
          click: (): void => {
            BrowserWindow.getFocusedWindow()?.webContents.send('focus-search')
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const }
            ]
          : [{ role: 'close' as const }])
      ]
    }
  ]

  return Menu.buildFromTemplate(template)
}
