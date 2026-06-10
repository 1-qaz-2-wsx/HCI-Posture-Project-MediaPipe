import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// ── Python 子进程管理 ──────────────────────────────────────
let pythonProcess: ChildProcessWithoutNullStreams | null = null

function startPythonProcess(mainWindow: BrowserWindow): void {
  // 根据开发/生产环境定位 main.py 的路径
  const scriptPath = is.dev
    ? join(__dirname, '../../core/main.py') // 开发时从项目根目录找
    : join(process.resourcesPath, 'core/main.py') // 打包后从 resources 找

  pythonProcess = spawn('python', [scriptPath])

  // 用 buffer 拼接，防止一个 data 事件里只收到半行 JSON
  let buffer = ''
  pythonProcess.stdout.on('data', (data: Buffer) => {
    buffer += data.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // 最后一段可能不完整，留到下次拼

    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const telemetry = JSON.parse(line)
        // 推给渲染进程
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send('posture-data', telemetry)
        }
      } catch {
        // 忽略解析失败的行（比如 Python 的 print 调试输出）
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
