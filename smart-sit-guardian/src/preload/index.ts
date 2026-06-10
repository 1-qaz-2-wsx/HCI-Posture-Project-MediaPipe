//src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // 持续监听 Python 发来的坐姿数据（每帧触发一次）
  onPostureData: (callback: (telemetry: unknown) => void): void => {
    ipcRenderer.on('posture-data', (_event, telemetry) => callback(telemetry))
  },

  // 向 Python 发送指令（校准用 'c'，退出用 'q'）
  sendPostureCommand: (command: string): void => {
    ipcRenderer.send('posture-command', command)
  },

  // 组件卸载时清理监听器，防止内存泄漏
  removePostureListener: (): void => {
    ipcRenderer.removeAllListeners('posture-data')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
