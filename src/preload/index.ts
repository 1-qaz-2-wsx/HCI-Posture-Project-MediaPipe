//src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  onPostureData: (callback: (telemetry: unknown) => void): void => {
    // 先清理旧的，再注册新的，确保全局只有一个监听器
    ipcRenderer.removeAllListeners('posture-data')
    ipcRenderer.on('posture-data', (_event, telemetry) => callback(telemetry))
  },

  // 向 Python 发送指令（校准用 'c'，退出用 'q'）
  sendPostureCommand: (command: string): void => {
    ipcRenderer.send('posture-command', command)
  },

  // 组件卸载时清理监听器，防止内存泄漏
  removePostureListener: (): void => {
    ipcRenderer.removeAllListeners('posture-data')
  },
  // 暂停坐姿检测，释放摄像头给游戏用
  pausePosture: (): void => {
    ipcRenderer.send('posture-command', 'pause')
  },
  // 恢复坐姿检测
  resumePosture: (): void => {
    ipcRenderer.send('posture-command', 'resume')
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
