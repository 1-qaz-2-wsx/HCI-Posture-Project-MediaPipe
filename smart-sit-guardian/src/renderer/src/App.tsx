// src/renderer/src/App.tsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import PostureFloatDeck from './components/PostureFloatDeck' // 🌟 引入悬浮窗
import { Task } from './types'

import TodoList from './pages/TodoList'
import FocusStation from './pages/FocusStation'
import RelaxStation from './pages/RelaxStation'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'

const TAB_TITLES: Record<string, string> = {
  dashboard: '实时坐姿与骨骼诊断',
  focus: '专注舱',
  relax: '解压舱',
  profile: '个人健康档案',
  todo: '待办清单'
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('focus')
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  // 🌟 将计时状态提升到 App 全局，以便悬浮窗和专注舱共享核心数据
  const [timerMode, setTimerMode] = useState<'work' | 'break' | 'idle'>('idle')
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)

  // 倒计时核心计时器
  useEffect(() => {
    let timer: any = null
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false)
      // 倒计时结束逻辑
      if (timerMode === 'work') {
        setTimerMode('idle')
        alert('专注完成！休息一下吧~')
      } else {
        setTimerMode('idle')
        alert('微休结束，准备开始新一轮专注吧！')
      }
    }
    return () => clearInterval(timer)
  }, [isTimerRunning, timeLeft, timerMode])

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const currentTask = tasks.find((t) => t.id === activeTaskId)
  const taskText = currentTask ? currentTask.text : '暂无锁定焦点'

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden select-none font-sans relative">
      {/* 🌟 核心修复：让全局随处悬浮窗永久常驻在 DOM 顶层，随时随地等待召唤 */}
      <PostureFloatDeck
        timeLeftStr={formatTime(timeLeft)}
        taskText={taskText}
        timerMode={timerMode}
      />

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 h-full flex flex-col p-6 overflow-hidden">
        <header className="w-full flex justify-between items-center mb-5 px-1">
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              当前工作舱
            </span>
            <h2 className="text-lg font-bold text-slate-700">{TAB_TITLES[activeTab]}</h2>
          </div>
        </header>

        <div className="flex-1 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="w-full h-full p-7 overflow-y-auto"
            >
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'focus' && (
                <FocusStation
                  tasks={tasks}
                  setTasks={setTasks}
                  activeTaskId={activeTaskId}
                  setActiveTaskId={setActiveTaskId}
                  goToRelax={() => setActiveTab('relax')}
                  goToTodo={() => setActiveTab('todo')}
                  goToDashboard={() => setActiveTab('dashboard')}
                  timerMode={timerMode}
                  setTimerMode={setTimerMode}
                  timeLeft={timeLeft}
                  setTimeLeft={setTimeLeft}
                  isTimerRunning={isTimerRunning}
                  setIsTimerRunning={setIsTimerRunning}
                  formatTime={formatTime}
                />
              )}
              {activeTab === 'relax' && <RelaxStation />}
              {activeTab === 'profile' && <Profile />}
              {activeTab === 'todo' && (
                <TodoList
                  tasks={tasks}
                  setTasks={setTasks}
                  activeTaskId={activeTaskId}
                  setActiveTaskId={setActiveTaskId}
                  goToPomodoro={() => setActiveTab('focus')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
