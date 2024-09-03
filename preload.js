const electron = require('electron/renderer')

electron.contextBridge.exposeInMainWorld('app', {
    selectFile: () => electron.ipcRenderer.invoke('app:selectFile'),
    openInBrowser: (location) => electron.ipcRenderer.invoke('app:openInBrowser', location),
    addChannel: (callback) => electron.ipcRenderer.on(
        'app:addChannel',
        (_) => callback()
    )
})