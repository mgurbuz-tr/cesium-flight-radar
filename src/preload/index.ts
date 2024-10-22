// preload/index.ts

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

contextBridge.exposeInMainWorld('flightAPI', {
  onFlightData: (callback: (data: any) => void) =>
    ipcRenderer.on('flight-data', (_, data) => callback(data)),
  setEmulateMode: () => ipcRenderer.send('set-emulate'),
  setApiMode: (userName: string, password: string) =>
    ipcRenderer.send('set-api', [userName, password])
})

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
}
