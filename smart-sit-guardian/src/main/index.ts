import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path, { join } from 'path'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
// import {creatInterface} from 'readline'

//动态计算虚拟环境python路径
const pythonExecutable = path.resolve(__dirname, '../../core/.venv/Scripts/python.exe')

// ── Python 子进程管理 ──────────────────────────────────────
let pythonProcess: ChildProcessWithoutNullStreams | null = null

function startPythonProcess(mainWindow: BrowserWindow): void {
  // 根据开发/生产环境定位 main.py 的路径
  const scriptPath = is.dev
    ? join(__dirname, '../../core/main.py') // 开发时从项目根目录找
    : join(process.resourcesPath, 'core/main.py') // 打包后从 resources 找

  pythonProcess = spawn(pythonExecutable, [scriptPath])

  // 用 buffer 拼接，防止一个 data 事件里只收到半行 JSON
  let buffer = ''
  let pendingTelemetry: object | null = null // 暂存上一行解析好的 JSON

  pythonProcess.stdout.on('data', (data: Buffer) => {
    console.log('[RAW stdout length]', data.length, data.toString().slice(0, 100))
    buffer += data.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // 最后一段可能不完整，留到下次拼

    for (const line of lines) {
      if (!line.trim()) continue

      if (line.startsWith('IMG:')) {
        // 这是图片行，和之前暂存的 JSON 合并后一起推给前端
        if (pendingTelemetry && !mainWindow.isDestroyed()) {
          const imgDataUrl = 'data:image/jpeg;base64,' + line.slice(4)
          mainWindow.webContents.send('posture-data', {
            ...pendingTelemetry,
            image: imgDataUrl
          })
          pendingTelemetry = null
        }
      } else {
        // 这是数据 JSON 行，先暂存
        try {
          pendingTelemetry = JSON.parse(line)
        } catch {
          // 忽略解析失败的行
        }
      }
    }
  })

  pythonProcess.stderr.on('data', (data: Buffer) => {
    console.error('[Python stderr]', data.toString())
  })

  pythonProcess.on('close', (code) => {
    console.log(`[Python] 进程退出，code: ${code}`)
    pythonProcess = null
  })
}

function stopPythonProcess(): void {
  if (pythonProcess) {
    pythonProcess.stdin.write('q\n') // 先礼貌地让 Python 自己退出
    setTimeout(() => {
      if (pythonProcess) {
        pythonProcess.kill() // 1 秒后还没退就强制杀掉
        pythonProcess = null
      }
    }, 1000)
  }
}

// ── 接收来自渲染进程的指令，转发给 Python stdin ────────────
ipcMain.on('posture-command', (_event, command: string) => {
  if (pythonProcess) {
    pythonProcess.stdin.write(command + '\n')
  }
})

// ── 窗口创建 ──────────────────────────────────────────────
function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 放开 CSP，允许加载 jsdelivr CDN 脚本（MediaPipe Hands 用）
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
            "script-src 'self' https://cdn.jsdelivr.net; " +
            "connect-src 'self' https://cdn.jsdelivr.net wss: blob:; " +
            "img-src 'self' data: blob:; " +
            "media-src 'self' blob:; " +
            'worker-src blob:;'
        ]
      }
    })
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    // 窗口显示后再启动 Python，确保 webContents 已准备好接收数据
    startPythonProcess(mainWindow)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── 应用生命周期 ───────────────────────────────────────────
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopPythonProcess() // App 关闭时顺手杀掉 Python
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
