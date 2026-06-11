// src/renderer/src/pages/FocusStation.tsx
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Coffee, Target, Sparkles, HelpCircle, Video } from 'lucide-react'
import { Task } from '../types'

interface FocusStationProps {
  tasks: Task[]
  setTasks: any
  activeTaskId: string | null
  setActiveTaskId: any
  goToRelax: () => void
  goToTodo: () => void
  goToDashboard: () => void
  timerMode: 'work' | 'break' | 'idle'
  setTimerMode: (mode: 'work' | 'break' | 'idle') => void
  timeLeft: number
  setTimeLeft: (time: number) => void
  isTimerRunning: boolean
  setIsTimerRunning: (run: boolean) => void
  formatTime: (sec: number) => string
}

export default function FocusStation({
  tasks,
  activeTaskId,
  goToRelax,
  goToTodo,
  goToDashboard,
  timerMode,
  setTimerMode,
  timeLeft,
  setTimeLeft,
  isTimerRunning,
  setIsTimerRunning,
  formatTime
}: FocusStationProps) {
  const currentTask = tasks.find((t) => t.id === activeTaskId)

  const startFocus = () => {
    setTimerMode('work')
    setTimeLeft(25 * 60)
    setIsTimerRunning(true)
  }

  const stopFocus = () => {
    setIsTimerRunning(false)
    setTimerMode('idle')
    setTimeLeft(25 * 60)
  }

  const triggerRelax = () => {
    setTimerMode('break')
    setTimeLeft(5 * 60)
    setIsTimerRunning(true)
    goToRelax()
  }

  // 🌟 核心机制 (2): 广播唤浮窗复位事件，让小画面瞬间闪现到视网膜中央
  const handleSummonDeck = () => {
    window.dispatchEvent(new CustomEvent('summon-posture-deck'))
  }

  const totalSeconds = timerMode === 'work' ? 25 * 60 : timerMode === 'break' ? 5 * 60 : 25 * 60
  const progressPercent = timerMode !== 'idle' ? (timeLeft / totalSeconds) * 100 : 100

  return (
    <div className="h-full w-full flex flex-col gap-4 relative min-h-[460px] bg-transparent">
      {/* 主控制面板 */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/60 border border-slate-100 rounded-3xl p-6 shadow-3xs">
        {/* 顶部提示与复位中控台 */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <div className="bg-amber-50/80 border border-amber-100 rounded-xl px-4 py-2 flex items-center gap-2 text-xs text-amber-800 shadow-3xs">
            <HelpCircle size={14} className="text-amber-500 animate-pulse" />
            <span>姿态监测不准？</span>
            <button
              onClick={goToDashboard}
              className="text-amber-600 font-bold hover:underline cursor-pointer"
            >
              前往[坐姿看板]一键校准 ➔
            </button>
          </div>

          {/* 🌟 核心调优 (2): 用户调起摄像头的绝对安全开关 */}
          {/* <button
            onClick={handleSummonDeck}
            className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-3xs transition-all active:scale-95 cursor-pointer"
          >
            <Video size={13} className="text-blue-500" />
            <span>📷 唤醒/重置悬浮小画面</span>
          </button> */}
        </div>

        {/* 精准无残缺进度圆环 */}
        <div className="relative w-56 h-56 rounded-full bg-white shadow-xl flex items-center justify-center border border-slate-100/80 mb-6">
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 200 200"
          >
            <circle
              cx="100"
              cy="100"
              r="90"
              className="stroke-slate-100 fill-none"
              strokeWidth="6"
            />
            <motion.circle
              cx="100"
              cy="100"
              r="90"
              // 🌟 核心调优 (1): 颜色与全局弹出条完美一致！Work时为标准心流蓝 (blue-500)
              className={`fill-none ${timerMode === 'break' ? 'stroke-emerald-500' : 'stroke-blue-500'}`}
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 90}
              animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - progressPercent / 100) }}
              transition={{ ease: 'linear' }}
            />
          </svg>

          {/* 数字中心 */}
          <div className="text-center z-10">
            <div className="text-4xl font-black font-mono tracking-tight text-slate-800">
              {formatTime(timeLeft)}
            </div>
            <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
              {timerMode === 'work'
                ? '🔥 FOCUSING'
                : timerMode === 'break'
                  ? '🍃 RELAXING'
                  : '⏱️ STANDBY'}
            </div>
          </div>
        </div>

        {/* 操控按钮与卡片：颜色同样对齐全局条 */}
        <div className="flex flex-col items-center gap-4 w-64">
          {!isTimerRunning ? (
            <button
              onClick={startFocus}
              // 🌟 核心调优 (1): 按钮底色同步改为心流蓝
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold py-3 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
            >
              <Play size={16} fill="white" />
              <span>开启心流（25 Mins）</span>
            </button>
          ) : (
            <button
              onClick={stopFocus}
              className="w-full bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-600 font-bold py-3 px-6 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer text-sm border border-slate-200"
            >
              <Square size={14} fill="currentColor" />
              <span>放弃并结束本次心流</span>
            </button>
          )}

          {/* 专注引导任务卡片 */}
          <AnimatePresence mode="wait">
            {currentTask ? (
              <motion.div
                key="has-task"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                // 🌟 核心调优 (1): 锁定焦点卡片改为浅蓝风格，与顶部完美呼应
                className="w-full bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex items-center gap-2"
              >
                <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-2xs">
                  <Target size={14} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[9px] font-black text-blue-600 tracking-wide uppercase">
                    当前锁定焦点
                  </div>
                  <p className="text-xs font-semibold text-blue-900 truncate mt-0.5">
                    {currentTask.text}
                  </p>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={goToTodo}
                className="w-full border border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-3 text-xs text-slate-400 hover:text-slate-500 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles size={13} className="text-amber-500" />
                <span>待办清单为空，点击绑定聚焦指标</span>
              </button>
            )}
          </AnimatePresence>

          {/* 正念微休快捷跳转入口 */}
          {timerMode === 'idle' && (
            <button
              onClick={triggerRelax}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 mt-1 transition-colors cursor-pointer hover:underline"
            >
              <Coffee size={13} />
              <span>累了？点击直接开启【正念微休】</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
