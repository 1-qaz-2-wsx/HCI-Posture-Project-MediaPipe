// src/renderer/src/pages/Pomodoro.tsx
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, RefreshCw, Coffee, Brain, Target, CheckCircle2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Task, SharedTodoProps } from '../types'

export interface PomodoroProps {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  activeTaskId: string | null
  setActiveTaskId: (id: string | null) => void
}

export default function Pomodoro({
  tasks,
  setTasks,
  activeTaskId,
  setActiveTaskId
}: SharedTodoProps) {
  // 专注周期配置：25分钟专注，5分钟休息
  const FOCUS_TIME = 25 * 60
  const BREAK_TIME = 5 * 60

  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME)
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<'focus' | 'break'>('focus') // focus: 专注模式, break: 休息模式

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // 寻找全局传进来的当前专注任务
  const currentTask = tasks.find((t) => t.id === activeTaskId) || null

  // 核心倒计时逻辑状态机
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleCycleComplete()
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, timeLeft])

  // 当倒计时归零时的结算逻辑（触发HCI情感化高峰体验）
  const handleCycleComplete = () => {
    setIsRunning(false)

    // 1. 爆裂漫天烟花
    confetti({
      particleCount: 180,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#3B82F6', '#10B981', '#F59E0B']
    })

    if (mode === 'focus') {
      // 2. 如果当前绑定了任务，自动在全局将该任务勾选为【已完成】
      if (activeTaskId) {
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === activeTaskId ? { ...task, completed: true } : task))
        )
        setActiveTaskId(null) // 释放专注槽
      }
      // 3. 自动切到休息模式
      setMode('break')
      setTimeLeft(BREAK_TIME)
    } else {
      // 休息结束，切回专注模式
      setMode('focus')
      setTimeLeft(FOCUS_TIME)
    }
  }

  const toggleTimer = () => setIsRunning(!isRunning)

  const resetTimer = () => {
    setIsRunning(false)
    setMode('focus')
    setTimeLeft(FOCUS_TIME)
  }

  // SVG 环形进度条数学公式计算
  const totalDuration = mode === 'focus' ? FOCUS_TIME : BREAK_TIME
  const progress = (totalDuration - timeLeft) / totalDuration
  const strokeDashoffset = 440 - 440 * progress // 440 是圆周长 (2 * PI * r, r=70)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  return (
    <div className="max-w-xl mx-auto h-full flex flex-col items-center justify-center select-none">
      {/* 顶部动态模式切换指示滑块 */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-2 mb-10 relative">
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 relative z-10 transition-colors">
          <Brain size={16} className={mode === 'focus' ? 'text-blue-600' : 'text-slate-400'} />
          <span>深度专注</span>
        </div>
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 relative z-10 transition-colors">
          <Coffee size={16} className={mode === 'break' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>正念微休</span>
        </div>

        {/* 背景果冻色滑块动效 */}
        <motion.div
          animate={{ x: mode === 'focus' ? 0 : 116 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className={`absolute top-1.5 bottom-1.5 left-1.5 w-[112px] rounded-xl -z-0 border ${
            mode === 'focus'
              ? 'bg-white border-blue-100 shadow-sm'
              : 'bg-white border-emerald-100 shadow-sm'
          }`}
        />
      </div>

      {/* 核心高质感 Apple 环形时间显示舱 */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-10">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          {/* 底层灰色轨道圆环 */}
          <circle cx="80" cy="80" r="70" className="stroke-slate-50 fill-none" strokeWidth="8" />
          {/* 顶层动态高阶彩色滑行圆环 */}
          <motion.circle
            cx="80"
            cy="80"
            r="70"
            className="fill-none stroke-linecap-round"
            strokeWidth="8"
            stroke={mode === 'focus' ? '#3B82F6' : '#10B981'}
            strokeDasharray="440"
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </svg>

        {/* 圆环中心的超大极简倒计时文本 */}
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-light text-slate-800 tracking-tighter font-mono">
            {formatTime(timeLeft)}
          </span>
          <span
            className={`text-[11px] font-bold tracking-widest uppercase mt-2 ${
              mode === 'focus' ? 'text-blue-500' : 'text-emerald-500'
            }`}
          >
            {isRunning ? '专注流淌中' : '心流准备就绪'}
          </span>
        </div>
      </div>

      {/* 跨组件协同看板：承接来自待办清单的任务卡片 */}
      <AnimatePresence mode="wait">
        {currentTask ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="w-full bg-blue-50/50 border border-blue-100/60 rounded-2xl p-4 flex items-center gap-4 mb-8"
          >
            <div className="w-9 h-9 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-100 flex-shrink-0 animate-pulse">
              <Target size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">
                当前锚定消灭的目标
              </div>
              <p className="text-sm font-medium text-blue-900 truncate mt-0.5">
                {currentTask.text}
              </p>
            </div>
            <div className="text-xs font-mono text-blue-400 font-medium bg-blue-50 px-2 py-1 rounded-md">
              25M
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-slate-400 bg-slate-50 border border-slate-100/70 px-4 py-2.5 rounded-xl mb-10 text-center max-w-sm leading-relaxed"
          >
            💡 提示：前往 <span className="font-semibold text-slate-600">待办清单</span>{' '}
            点击任务右侧的“去专注”，可将特定学习任务绑定至此效率环。
          </motion.div>
        )}
      </AnimatePresence>

      {/* 悬浮微控制按钮组 */}
      <div className="flex items-center gap-5">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTimer}
          className={`flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold shadow-md transition-all text-sm ${
            isRunning
              ? 'bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600'
              : mode === 'focus'
                ? 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'
                : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'
          }`}
        >
          {isRunning ? <Square size={16} fill="white" /> : <Play size={16} fill="white" />}
          <span>{isRunning ? '暂停专注' : mode === 'focus' ? '开启心流' : '开始微休'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          onClick={resetTimer}
          className="p-4 rounded-2xl bg-white text-slate-400 hover:text-slate-600 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
        >
          <RefreshCw size={16} />
        </motion.button>
      </div>
    </div>
  )
}
