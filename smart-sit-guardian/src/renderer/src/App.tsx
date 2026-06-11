// src/renderer/src/App.tsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import { Task } from './types'
import { Timer, Coffee, Video } from 'lucide-react'

import TodoList from './pages/TodoList'
import FocusStation from './pages/FocusStation'
import RelaxStation from './pages/RelaxStation'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import PostureFloatDeck from './components/PostureFloatDeck'

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

  // 全局计时状态
  const [timerMode, setTimerMode] = useState<'work' | 'break' | 'idle'>('idle')
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)

  //全局唯一坐姿数据源（只在APP中注册一次监听）
  const [postureImg, setPostureImg] = useState<string | null>(null)
  const [postureColor, setPostureColor] = useState<'green' | 'orange' | 'red'>('orange')
  const [postureData, setPostureData] = useState<any>(null)
  const [showFloat, setShowFloat] = useState<boolean>(false)

  useEffect(() => {
    const api = (window as any).api
    if (!api?.onPostureData) return
    api.onPostureData((t: any) => {
      if (!t) return
      setPostureData(t)
      if (t.image) setPostureImg(t.image)
      if (t.statusColor) setPostureColor(t.statusColor)
    })
    return () => api?.removePostureListener?.()
  }, [])

  // 全局计时器效果
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false)
      if (timerMode === 'work') {
        alert('🎉 恭喜完成一轮专注！进入正念微休放松一下吧。')
        setTimerMode('idle')
      } else if (timerMode === 'break') {
        alert('💪 休息结束，精力已充满，准备开始新一轮专注吧！')
        setTimerMode('idle')
      }
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTimerRunning, timeLeft, timerMode])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden select-none font-sans relative">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 h-full flex flex-col p-6 overflow-hidden relative">
        {/*全局上方倒计时条与布局修复（不遮挡文字） */}
        <AnimatePresence>
          {isTimerRunning && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              //  调整 z-index 和顶部间距，不遮挡左上角标题
              className={`absolute top-0 left-6 right-6 h-12 z-40 rounded-b-2xl border-x border-b shadow-md flex items-center justify-between px-6 backdrop-blur-md ${
                timerMode === 'work'
                  ? 'bg-blue-50/90 border-blue-100 text-blue-900'
                  : 'bg-emerald-50/90 border-emerald-100 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold tracking-wide">
                {timerMode === 'work' ? (
                  <>
                    <Timer size={14} className="animate-spin text-blue-500" /> 深度心流构建中...
                  </>
                ) : (
                  <>
                    <Coffee size={14} className="animate-bounce text-emerald-500" />{' '}
                    正念微休进行时...
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs opacity-75 font-medium">
                  {timerMode === 'work'
                    ? `当前任务: ${tasks.find((t) => t.id === activeTaskId)?.text || '自由心流'}`
                    : '放空大脑，舒缓身体'}
                </span>
                <span className="font-mono font-black text-sm bg-white/80 px-2.5 py-0.5 rounded-lg shadow-2xs border border-inherit">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 标题栏布局优化，留出顶部空间 */}
        <header className="w-full flex justify-between items-center mb-5 px-1 mt-6">
          <div className="mt-2">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              当前工作舱
            </span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              {TAB_TITLES[activeTab]}
            </h2>
          </div>
        </header>

        <div className="flex-1 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="w-full h-full p-7 overflow-y-auto"
            >
              {activeTab === 'dashboard' && (
                <Dashboard postureImg={postureImg} postureData={postureData} />
              )}
              {activeTab === 'focus' && (
                <FocusStation
                  tasks={tasks}
                  setTasks={setTasks}
                  activeTaskId={activeTaskId}
                  setActiveTaskId={setActiveTaskId}
                  goToRelax={() => setActiveTab('relax')}
                  goToTodo={() => setActiveTab('todo')}
                  goToDashboard={() => setActiveTab('dashboard')}
                  // 传递计时状态与操控函数
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
      {/* ── 悬浮窗（传入共享数据，不自己注册监听）── */}
      {showFloat && (
        <PostureFloatDeck
          imgSrc={postureImg}
          statusColor={postureColor}
          isDashboard={activeTab === 'dashboard'}
          onClose={() => setShowFloat(false)}
        />
      )}
      {/* ── 右下角唤醒按钮（悬浮窗关闭时显示）── */}
      <AnimatePresence>
        {!showFloat && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setShowFloat(true)}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-white border-2 border-slate-200 rounded-2xl shadow-lg flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-xl transition-all"
            title="唤醒坐姿监测窗"
          >
            <Video size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
