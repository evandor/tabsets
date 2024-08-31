import { app, BrowserWindow, nativeTheme, BrowserView } from 'electron';
import path from 'path';
import os from 'os';

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

try {
  if (platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(
      path.join(app.getPath('userData'), 'DevTools Extensions')
    );
  }
} catch (_) {}

let mainWindow: BrowserWindow | undefined;

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
    width: 1800,
    height: 1400,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      webviewTag: true,
      //nativeWindowOpen: true, // https://stackoverflow.com/questions/50349881/firebase-auth-electron-failure
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  mainWindow.loadURL(process.env.APP_URL);

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });

  //const win = new BrowserWindow({ width: 800, height: 600 })

  // const view = new BrowserView()
  // mainWindow.setBrowserView(view)
  // view.setBounds({ x: 300, y: 50, width: 500, height: 500 })
  // view.webContents.loadURL('https://www.intimissimi.com/de/')
}

app.whenReady().then(createWindow);

//https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app
app.on('open-url', (event, url) => {
  //dialog.showErrorBox('Welcome Back', `You arrived from: ${url}`)
  const path = url.split("//")[1]
  console.log("appURL", process.env.APP_URL + path)
  mainWindow?.loadURL(process.env.APP_URL + path);
})

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    createWindow();
  }
});


const {ipcMain} = require('electron')

ipcMain.handle('tabsetApi:load-prefs', (e: any, url: any) => {
  shell.openExternal(url)
  return {msg: 'yeah'}
})

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('electron-tabsets', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('electron-tabsets')
}



// app.whenReady().then(() => {
//   // const win = new BrowserWindow({ width: 800, height: 600 })
//
//   const view = new BrowserView()
//   mainWindow?.setBrowserView(view)
//   view.setBounds({ x: 0, y: 0, width: 600, height: 600 })
//   view.webContents.loadURL('https://electronjs.org')
// })
