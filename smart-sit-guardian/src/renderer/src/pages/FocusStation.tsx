// src/renderer/src/pages/FocusStation.tsx
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, RefreshCw, Coffee, Brain, Target, Wind, Leaf } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Task, SharedTodoProps } from '../types'

// 坐姿小窗：复用 window.api，compact 模式只显示视频画面和状态色
function PostureMiniWindow() {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [statusColor, setStatusColor] = useState<'green' | 'orange' | 'red'>('orange')

  useEffect(() => {
    const api = (window as any).api
    if (!api?.onPostureData) return
    api.onPostureData((t: any) => {
      if (t.image) setImgSrc(t.image)
      if (t.statusColor) setStatusColor(t.statusColor)
    })
    return () => api.removePostureListener?.()
  }, [])

  const ringColor =
    statusColor === 'green'
      ? 'ring-emerald-400'
      : statusColor === 'red'
        ? 'ring-rose-400 animate-pulse'
        : 'ring-amber-400'

  return (
    <div
      className={`relative rounded-2xl overflow-hidden ring-2 ${ringColor} transition-all duration-500`}
      style={{ width: 160, height: 112 }}
    >
      {imgSrc ? (
        <img src={imgSrc} className="w-full h-full object-cover" alt="posture" />
      ) : (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-mono">
          等待 AI 内核...
        </div>
      )}
      <div
        className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
          statusColor === 'green'
            ? 'bg-emerald-400'
            : statusColor === 'red'
              ? 'bg-rose-400'
              : 'bg-amber-400'
        }`}
      />
    </div>
  )
}

interface FocusStationProps extends SharedTodoProps {
  goToRelax: () => void
  goToTodo: () => void
}

const FOCUS_TIME = 25 * 60
const BREAK_TIME = 5 * 60

export default function FocusStation({
  tasks,
  setTasks,
  activeTaskId,
  setActiveTaskId,
  goToRelax,
  goToTodo
}: FocusStationProps) {
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME)
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<'focus' | 'break'>('focus')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const currentTask = tasks.find((t) => t.id === activeTaskId) || null

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((p) => p - 1), 1000)
    } else if (timeLeft === 0) {
      handleCycleComplete()
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, timeLeft])

  const handleCycleComplete = () => {
    setIsRunning(false)
    confetti({
      particleCount: 180,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#3B82F6', '#10B981', '#F59E0B']
    })
    if (mode === 'focus') {
      if (activeTaskId) {
        setTasks((prev) => prev.map((t) => (t.id === activeTaskId ? { ...t, completed: true } : t)))
        setActiveTaskId(null)
      }
      setMode('break')
      setTimeLeft(BREAK_TIME)
    } else {
      setMode('focus')
      setTimeLeft(FOCUS_TIME)
    }
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const total = mode === 'focus' ? FOCUS_TIME : BREAK_TIME
  const progress = (total - timeLeft) / total
  const dashOffset = 440 - 440 * progress

  // ══ 休息模式：静谧全屏 ══
  if (mode === 'break') {
    return (
      <motion.div
        key="break"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col items-center justify-center gap-8 relative"
        style={{ background: 'linear-gradient(160deg,#f0fdf4 0%,#ecfdf5 40%,#f0f9ff 100%)' }}
      >
        {/* 静谧背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-emerald-100/40"
              style={{
                width: 80 + i * 40,
                height: 80 + i * 40,
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`
              }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
            <Leaf size={24} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-light text-slate-700 tracking-wide">正念微休</h2>
          <p className="text-sm text-slate-400">深呼吸，放松肩膀，闭上眼睛</p>
        </div>

        {/* 休息倒计时 */}
        <div className="relative z-10 w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r="70"
              className="stroke-emerald-50 fill-none"
              strokeWidth="6"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              className="fill-none"
              strokeWidth="6"
              stroke="#10b981"
              strokeDasharray="440"
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-light text-slate-700 font-mono tracking-tighter">
              {fmt(timeLeft)}
            </span>
            <span className="text-[10px] text-emerald-500 font-semibold tracking-widest uppercase mt-1">
              休息中
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="relative z-10 flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-semibold shadow-md shadow-emerald-100"
          >
            {isRunning ? <Square size={15} fill="white" /> : <Play size={15} fill="white" />}
            <span>{isRunning ? '暂停' : '开始休息'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToRelax}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-emerald-100 text-emerald-700 text-sm font-semibold shadow-sm"
          >
            <Wind size={15} />
            <span>去解压舱</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            onClick={() => {
              setMode('focus')
              setTimeLeft(FOCUS_TIME)
              setIsRunning(false)
            }}
            className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400"
          >
            <RefreshCw size={15} />
          </motion.button>
        </div>
      </motion.div>
    )
  }

  // ══ 专注模式 ══
  return (
    <motion.div
      key="focus"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col gap-5 select-none max-w-3xl mx-auto"
    >
      {/* 顶部：模式切换标签 */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1.5 w-fit self-center relative">
        <div className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-slate-700 relative z-10">
          <Brain size={15} className="text-blue-600" />
          <span>深度专注</span>
        </div>
        <div className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-slate-400 relative z-10">
          <Coffee size={15} className="text-slate-300" />
          <span>正念微休</span>
        </div>
        <motion.div
          animate={{ x: 0 }}
          className="absolute top-1.5 bottom-1.5 left-1.5 w-[112px] rounded-xl bg-white border border-blue-100 shadow-sm -z-0"
        />
      </div>

      {/* 主体：左侧计时 + 右侧坐姿小窗 */}
      <div className="flex-1 flex gap-6 items-start">
        {/* 左侧：计时环 + 任务卡 */}
        <div className="flex-1 flex flex-col items-center gap-6">
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="70"
                className="stroke-slate-50 fill-none"
                strokeWidth="8"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                className="fill-none"
                strokeWidth="8"
                stroke="#3B82F6"
                strokeDasharray="440"
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-light text-slate-800 font-mono tracking-tighter">
                {fmt(timeLeft)}
              </span>
              <span className="text-[10px] text-blue-500 font-bold tracking-widest uppercase mt-2">
                {isRunning ? '专注流淌中' : '心流准备就绪'}
              </span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold text-sm shadow-md ${
                isRunning
                  ? 'bg-amber-500 text-white shadow-amber-100'
                  : 'bg-blue-600 text-white shadow-blue-100'
              }`}
            >
              {isRunning ? <Square size={15} fill="white" /> : <Play size={15} fill="white" />}
              <span>{isRunning ? '暂停专注' : '开启心流'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              onClick={() => {
                setIsRunning(false)
                setMode('focus')
                setTimeLeft(FOCUS_TIME)
              }}
              className="p-3.5 rounded-2xl bg-white border border-slate-100 text-slate-400"
            >
              <RefreshCw size={15} />
            </motion.button>
          </div>

          {/* 任务绑定 */}
          <AnimatePresence mode="wait">
            {currentTask ? (
              <motion.div
                key="task"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="w-full max-w-xs bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0 animate-pulse">
                  <Target size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">
                    当前专注目标
                  </div>
                  <p className="text-sm font-medium text-blue-900 truncate mt-0.5">
                    {currentTask.text}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="no-task"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-slate-400 text-center max-w-xs"
              >
                💡 前往{' '}
                <button
                  onClick={goToTodo}
                  className="font-semibold text-slate-600 underline underline-offset-2"
                >
                  待办清单
                </button>{' '}
                绑定一个任务到此专注环
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 右侧：坐姿小窗 + 提示 */}
        <div className="flex flex-col gap-4 items-center pt-4">
          <div className="text-xs font-semibold text-slate-500 tracking-wide">坐姿实时监测</div>
          <PostureMiniWindow />
          <p className="text-[10px] text-slate-400 text-center w-40 leading-relaxed">
            专注期间 AI 实时监测你的坐姿，绿色表示姿态良好
          </p>
        </div>
      </div>
    </motion.div>
  )
}
