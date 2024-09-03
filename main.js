const electron = require('electron')
const path = require('path')

electron.app.setAsDefaultProtocolClient('rtmp')

electron.app.on('ready', async () => {
    const window = new electron.BrowserWindow({
        width: 1000,
        height: 1000,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        },
    });
    await window.loadFile('./front/index.html')
    // window.webContents.openDevTools()
    electron.ipcMain.handle('app:selectFile', () => {
        return electron.dialog.showOpenDialog({ properties: ['openFile'] })
    })

    electron.ipcMain.handle('app:openInBrowser', (event, location) => {
        electron.shell.openExternal(location)
    })

    electron.app.on('open-url', function (_, urlString) {
        if (urlString.endsWith('addChannel')) {
            window.webContents.send('app:addChannel')
        }
    })
})