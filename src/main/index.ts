// main/index.ts

import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import axios from 'axios'
import https from 'https'
import fs from 'fs'
import path from 'path'

let mainWindow: BrowserWindow | null
let flightDataInterval: NodeJS.Timeout | null = null
let flightDataFiles: string[] = []
let currentFileIndex = 0
let isEmulateMode = false

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1365,
    height: 840,
    show: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? {} : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      // mainWindow?.webContents.openDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] as string)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('exit', () => app.quit())

  createWindow()
  // mainWindow?.webContents.openDevTools()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('set-emulate', () => {
  console.log('Setting mode to Emulate')
  startEmulateMode()
})

ipcMain.on('set-api', (event, args) => {
  startApiMode(args[0], args[1])
})

function startEmulateMode() {
  if (flightDataInterval) {
    clearInterval(flightDataInterval)
    flightDataInterval = null
  }
  isEmulateMode = true
  loadFlightDataFiles()
  startFlightDataLoop()
}

function startApiMode(userName, password) {
  if (flightDataInterval) {
    clearInterval(flightDataInterval)
    flightDataInterval = null
  }
  isEmulateMode = false
  startFlightDataFetching(userName, password)
}

function loadFlightDataFiles() {
  const filesDir = path.join(__dirname, '../../static') 
  if (!fs.existsSync(filesDir)) {
    console.error(`Flight data directory does not exist: ${filesDir}`)
    return
  }
  flightDataFiles = fs
    .readdirSync(filesDir)
    .filter((file) => file.startsWith('flightData_') && file.endsWith('.json'))
    .map((file) => path.join(filesDir, file))
  currentFileIndex = 0
}

function startFlightDataLoop() {
  if (flightDataFiles.length === 0) {
    console.error('No flight data files found.')
    return
  }

  flightDataInterval = setInterval(() => {
    try {
      const currentFile = flightDataFiles[currentFileIndex]
      const flightData = fs.readFileSync(currentFile, 'utf8')

      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('flight-data', JSON.parse(flightData))
      }

      currentFileIndex = (currentFileIndex + 1) % flightDataFiles.length
    } catch (error) {
      console.error('Error reading flight data file:', error)
    }
  }, 2000) 
}

function startFlightDataFetching(username: string, password: string) {
  flightDataInterval = setInterval(async () => {
    try {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false 
      })
      const flightData = await axios.get('https://opensky-network.org/api/states/all', {
        httpsAgent,
        auth: {
          username: username, 
          password: password 
        }
      })

      // if (flightData.data) {
      //   fs.writeFileSync(`flightData_${Date.now()}.json`, JSON.stringify(flightData.data), 'utf8')
      // }

      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('flight-data', flightData.data)
      }
    } catch (error) {
      console.error('API hatası:', error)
    }
  }, 10000)
}