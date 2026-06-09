import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import { Task } from './types'

//页面组件
import TodoList from './pages/TodoList'
import Pomodoro from './pages/Pomodoro'
import Game from './pages/Game'
import Profile from './pages/Profile'
//空组件占位
const Dashboard = () => (
  <div className="text-slate-500 font-light text-sm">
    📊 正在构建 MediaPipe 坐姿多维行为诊断看板...
  </div>
)

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden select-none font-sans">
      {/* 左侧极简莫兰迪导航栏 */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 右侧主业务工作舱 */}
      <div className="flex-1 h-full flex flex-col p-6 overflow-hidden">
        {/* 全局顶部状态栏 */}
        <header className="w-full flex justify-between items-center mb-6 px-2">
          <div>
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
              当前工作舱
            </span>
            <h2 className="text-xl font-bold text-slate-800 mt-0.5">
              {activeTab === 'dashboard' && '实时坐姿与多维行为诊断'}
              {activeTab === 'todo' && '日常效率任务管理'}
              {activeTab === 'pomodoro' && '专注番茄钟'}
              {activeTab === 'profile' && '个人健康档案中心'}
              {activeTab === 'game' && '手势交互解压舱'}
            </h2>
          </div>

          {/* AI 算法状态通信灯（体现HCI系统的可反馈性） */}
          <div className="flex items-center gap-2 bg-white border border-slate-100 shadow-sm px-4 py-2 rounded-full text-xs font-semibold text-slate-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            AI 后台内核就绪
          </div>
        </header>

        {/* 核心卡片容器：带平滑切页的动效 */}
        <div className="flex-1 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'todo' && (
                <TodoList
                  tasks={tasks}
                  setTasks={setTasks}
                  activeTaskId={activeTaskId}
                  setActiveTaskId={setActiveTaskId}
                  goToPomodoro={() => setActiveTab('pomodoro')}
                />
              )}
              {activeTab === 'pomodoro' && (
                <Pomodoro
                  tasks={tasks}
                  setTasks={setTasks}
                  activeTaskId={activeTaskId}
                  setActiveTaskId={setActiveTaskId}
                />
              )}
              {activeTab === 'profile' && <Profile />}
              {activeTab === 'game' && <Game />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
