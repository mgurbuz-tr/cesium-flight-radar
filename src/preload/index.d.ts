// preload/index.d.ts

import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface FlightAPI {
    onFlightData: (callback: (data: any) => void) => void
    setEmulateMode: () => void
    setApiMode: (username: string, password: string) => void
  }
  interface Window {
    electron: ElectronAPI
    flightAPI: FlightAPI
  }
}
