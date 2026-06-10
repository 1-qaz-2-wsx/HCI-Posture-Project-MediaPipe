// src/renderer/src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, ShieldAlert, Video, RefreshCw, Compass } from 'lucide-react'
import { useRef } from 'react'

// 1. 🌟 定义专属于坐姿雷达的 IPC 桥梁契约接口
interface PostureAPI {
  onPostureData: (callback: (telemetry: any) => void) => void
  sendPostureCommand: (command: string) => void
}

interface TelemetryData {
  hasUser: boolean
  isCalibrated: boolean
  statusText: string
  statusColor: 'green' | 'orange' | 'red'
  score: number
  angleDeviation: number
  zDeviation: number
}

export default function Dashboard() {
  const [data, setData] = useState<TelemetryData>({
    hasUser: false,
    isCalibrated: false,
    statusText: 'STATUS: WAITING FOR CORE KERNEL...',
    statusColor: 'orange',
    score: 100,
    angleDeviation: 0,
    zDeviation: 0
  })
  // 在 Dashboard 组件内，useState 那些声明的旁边加
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let stream: MediaStream | null = null

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((s) => {
        stream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
        }
      })
      .catch((err) => {
        console.error('摄像头获取失败:', err)
      })

    // 组件卸载时释放摄像头
    return () => {
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  // 2. 🌟 安全地从全局 window 中抽离出具备完整类型的 api 对象
  const pcieBridge = (window as any).api as PostureAPI | undefined

  // 监听来自 Electron 主进程管道传输进来的实时 AI 数据
  useEffect(() => {
    if (pcieBridge && pcieBridge.onPostureData) {
      pcieBridge.onPostureData((telemetry: TelemetryData) => {
        setData(telemetry)
      })
    }
  }, [])

  // HCI 核心交互：点击向后台正在运行的 Python 写入校准命令 'c'
  const handleCalibrate = () => {
    if (pcieBridge && pcieBridge.sendPostureCommand) {
      pcieBridge.sendPostureCommand('c')
    }
  }

  // 根据分数计算颜色主题
  const getTheme = (score: number) => {
    if (score >= 85) return { text: 'text-blue-500', stroke: '#3b82f6' }
    if (score >= 60) return { text: 'text-amber-500', stroke: '#f59e0b' }
    return { text: 'text-rose-500', stroke: '#ef4444' }
  }

  const currentTheme = getTheme(data.score)

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-6 select-none">
      {/* 顶部中央三色流控提示牌 */}
      <div
        className={`border p-4 rounded-2xl flex items-center justify-between transition-all duration-300 ${
          data.statusColor === 'green'
            ? 'bg-emerald-50/50 border-emerald-100'
            : data.statusColor === 'red'
              ? 'bg-rose-50/50 border-rose-100 animate-pulse'
              : 'bg-amber-50/50 border-amber-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl bg-white shadow-xs ${
              data.statusColor === 'green'
                ? 'text-emerald-500'
                : data.statusColor === 'red'
                  ? 'text-rose-500'
                  : 'text-amber-500'
            }`}
          >
            <Activity size={18} />
          </div>
          <span className="text-xs font-bold tracking-wider font-mono text-slate-700">
            {data.statusText}
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCalibrate}
          disabled={!data.hasUser}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all ${
            data.hasUser
              ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <RefreshCw
            size={13}
            className={!data.isCalibrated && data.hasUser ? 'animate-spin' : ''}
          />
          <span>{data.isCalibrated ? '重新校准标准坐姿' : '录入标准原点 (C)'}</span>
        </motion.button>
      </div>

      {/* 中部双翼看板：左侧大健康环，右侧精细多维诊断指标 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 flex-1 items-stretch">
        {/* 左侧：Apple 环形大仪表 */}
        <div className="md:col-span-2 bg-slate-50/40 border border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-slate-100 fill-none"
                strokeWidth="6"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                className="fill-none stroke-linecap-round"
                strokeWidth="6"
                style={{ stroke: currentTheme.stroke }}
                strokeDasharray="264"
                animate={{ strokeDashoffset: 264 - (264 * data.score) / 100 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span
                className={`text-4xl font-bold font-mono tracking-tighter ${currentTheme.text}`}
              >
                {data.score}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-1">
                健康依从率
              </span>
            </div>
          </div>
          {/* 摄像头 */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full rounded-2xl mt-4 object-cover"
            style={{ maxHeight: '120px' }}
          />
          {/* <div className="flex items-center gap-2 mt-5 text-xs text-slate-500 font-medium">
            <Video
              size={14}
              className={data.hasUser ? 'text-emerald-500 animate-pulse' : 'text-slate-300'}
            />
            <span>
              {data.hasUser ? 'MediaPipe 视频流交互就绪' : '未检测到用户，请正坐于相机前'}
            </span>
          </div> */}
        </div>

        {/* 右侧：多维解剖学空间骨骼标尺 */}
        <div className="md:col-span-3 bg-white border border-slate-100 rounded-3xl p-6 flex flex-col justify-between gap-4 shadow-xs">
          {/* 指标 1：耳肩连线偏离 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <Compass size={14} className="text-blue-500" /> 耳肩解剖夹角偏离
              </span>
              <span className="font-mono font-bold bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md">
                {data.angleDeviation > 0 ? `+${data.angleDeviation}` : data.angleDeviation} °
              </span>
            </div>
            <div className="relative h-6 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center px-2">
              <motion.div
                className="h-2 bg-blue-500 rounded-full"
                animate={{ width: `${Math.min(Math.abs(data.angleDeviation) * 5, 100)}%` }}
                style={{ originX: 0 }}
              />
              <div
                className="absolute left-[40%] top-0 bottom-0 w-0.5 bg-red-400/40 border-dashed"
                title="驼背警戒线"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              标准误差容忍上限：8.0°（偏离过大判定为弓背）
            </p>
          </div>

          {/* 指标 2：Z轴前倾变化 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-amber-500" /> 颈椎正面深度前倾 (Z轴)
              </span>
              <span className="font-mono font-bold bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md">
                {data.zDeviation > 0 ? `+${data.zDeviation}` : data.zDeviation}
              </span>
            </div>
            <div className="relative h-6 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center px-2">
              <motion.div
                className="h-2 bg-amber-500 rounded-full"
                animate={{ width: `${Math.min(Math.abs(data.zDeviation) * 1000, 100)}%` }}
                style={{ originX: 0 }}
              />
              <div
                className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-red-400/40 border-dashed"
                title="探头警戒线"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              标准深度容忍上限：0.040（数值剧烈上扬意味着头部前探）
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
