import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      onPostureData: (callback: (telemetry: unknown) => void) => void
      sendPostureCommand: (command: string) => void
      removePostureListener: () => void
    }
  }
}
