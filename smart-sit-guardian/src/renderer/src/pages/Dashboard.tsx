// src/renderer/src/pages/Dashboard.tsx
import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, ShieldAlert, RefreshCw, Compass } from 'lucide-react'

interface TelemetryData {
  hasUser: boolean
  isCalibrated: boolean
  statusText: string
  statusColor: 'green' | 'orange' | 'red'
  score: number
  angleDeviation: number
  zDeviation: number
}

interface DashboardProps {
  postureImg: string | null
  postureData: TelemetryData | null
}

export default function Dashboard({ postureImg, postureData }: DashboardProps) {
  // 🌟 修改点 1：使用高性能 Ref 记录总检测帧数与良好姿态帧数
  const totalFrames = useRef<number>(0)
  const goodFrames = useRef<number>(0)
  const [complianceRate, setComplianceRate] = useState<number>(100)

  const data: TelemetryData = postureData ?? {
    hasUser: false,
    isCalibrated: false,
    statusText: 'STATUS: WAITING FOR CORE KERNEL...',
    statusColor: 'orange',
    score: 100,
    angleDeviation: 0,
    zDeviation: 0
  }

  // 🌟 核心优化：只要管道有用户数据流入，就动态滚动累加计算真实的健康依从率
  useEffect(() => {
    if (data.hasUser) {
      totalFrames.current += 1
      // 当 statusColor 为 green 时，意味着符合人体工学优秀范畴
      if (data.statusColor === 'green') {
        goodFrames.current += 1
      }
      // 计算得出百分比结果
      const rate = Math.round((goodFrames.current / totalFrames.current) * 100)
      setComplianceRate(rate)
    }
  }, [data.score, data.statusColor, data.hasUser])

  const handleCalibrate = () => {
    ;(window as any).api?.sendPostureCommand?.('c')
    // 校准时平滑复位计算器
    totalFrames.current = 0
    goodFrames.current = 0
    setComplianceRate(100)
  }

  const getTheme = (score: number) => {
    if (score >= 85) return { text: 'text-blue-500', stroke: '#3b82f6' }
    if (score >= 60) return { text: 'text-amber-500', stroke: '#f59e0b' }
    return { text: 'text-rose-500', stroke: '#ef4444' }
  }
  const theme = getTheme(data.score)

  // 针对实时依从率环单独配专属主题色
  const getComplianceTheme = (rate: number) => {
    if (rate >= 80) return { text: 'text-emerald-500', stroke: '#10b981' }
    if (rate >= 60) return { text: 'text-amber-500', stroke: '#f59e0b' }
    return { text: 'text-rose-500', stroke: '#ef4444' }
  }
  const compTheme = getComplianceTheme(complianceRate)

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-5 select-none">
      {/* 状态栏 */}
      <div
        className={`border p-3.5 rounded-2xl flex items-center justify-between transition-all ${
          data.statusColor === 'green'
            ? 'bg-emerald-50/50 border-emerald-100'
            : data.statusColor === 'red'
              ? 'bg-rose-50/50 border-rose-100 animate-pulse'
              : 'bg-amber-50/50 border-amber-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-1.5 rounded-xl bg-white shadow-xs ${
              data.statusColor === 'green'
                ? 'text-emerald-500'
                : data.statusColor === 'red'
                  ? 'text-rose-500'
                  : 'text-amber-500'
            }`}
          >
            <Activity size={16} />
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
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all ${
            data.hasUser
              ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <RefreshCw
            size={12}
            className={!data.isCalibrated && data.hasUser ? 'animate-spin' : ''}
          />
          <span>{data.isCalibrated ? '重新校准' : '录入标准原点 (C)'}</span>
        </motion.button>
      </div>

      {/* 主体：🌟 修改点 2：改为 grid-cols-2 使得左右两块绝对等半平分 */}
      <div className="grid grid-cols-2 gap-5 flex-1 items-stretch">
        {/* 左侧：摄像头画面 + 科学依从率环 */}
        <div className="bg-slate-50/40 border border-slate-100 rounded-3xl p-4 flex flex-col gap-3 items-center">
          {/* 摄像头画面优先 */}
          <div className="w-full flex-1 rounded-2xl overflow-hidden bg-slate-100 min-h-0">
            {postureImg ? (
              <img src={postureImg} alt="posture stream" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-mono animate-pulse min-h-[160px]">
                LOADING AI PIPELINE...
              </div>
            )}
          </div>

          {/* 健康环缩小版 - 🌟 改为展现基于时间周期的总良好率 */}
          <div className="flex items-center gap-3 w-full bg-white border border-slate-100 rounded-2xl px-4 py-2.5">
            <div className="relative w-12 h-12 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  className="stroke-slate-100 fill-none"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="24"
                  cy="24"
                  r="20"
                  className="fill-none"
                  strokeWidth="4"
                  style={{ stroke: compTheme.stroke }}
                  strokeDasharray="125.6"
                  animate={{ strokeDashoffset: 125.6 - (125.6 * complianceRate) / 100 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-[10px] font-black font-mono ${compTheme.text}`}>
                  {data.score}
                </span>
              </div>
            </div>
            <div>
              <div className={`text-sm font-black font-mono ${compTheme.text}`}>
                {complianceRate}%
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                总体依从率 (良好帧 / 总帧)
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：解剖夹角指标 */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 flex flex-col justify-between gap-5 shadow-xs">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <Compass size={13} className="text-blue-500" /> 耳肩解剖夹角偏离
              </span>
              <span className="font-mono font-bold bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md">
                {data.angleDeviation > 0 ? `+${data.angleDeviation}` : data.angleDeviation} °
              </span>
            </div>
            <div className="relative h-5 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center px-2">
              <motion.div
                className="h-2 bg-blue-500 rounded-full"
                animate={{
                  width: `${data.angleDeviation > 0 ? Math.min(Math.abs(data.angleDeviation) * 5, 100) : 0}%`
                }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
                style={{ originX: 0 }}
              />
              <div className="absolute left-[40%] top-0 bottom-0 w-0.5 bg-red-400/40" />
            </div>
            <p className="text-[10px] text-slate-400">标准上限：8.0°（偏离过大判定为弯腰驼背）</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-1.5">
                <ShieldAlert size={13} className="text-amber-500" /> 颈椎前后体态重心 (Z轴)
              </span>
              <span className="font-mono font-bold bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md">
                {data.zDeviation > 0 ? `前倾 +${data.zDeviation}` : `后仰 ${data.zDeviation}`}
              </span>
            </div>
            <div className="relative h-5 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center px-2">
              <motion.div
                className="h-2 bg-amber-500 rounded-full"
                animate={{
                  width: `${data.zDeviation > 0 ? Math.min(Math.abs(data.zDeviation) * 500, 100) : 0}%`
                }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
                style={{ originX: 0 }}
              />
              <div className="absolute left-[20%] top-0 bottom-0 w-0.5 bg-red-400/40" />
            </div>
            <p className="text-[10px] text-slate-400">标准上限：0.040（上扬意味着头部习惯前探）</p>
          </div>
        </div>
      </div>
    </div>
  )
}
