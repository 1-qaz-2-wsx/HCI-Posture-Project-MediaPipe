// src/renderer/src/App.tsx
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
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

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden select-none font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 h-full flex flex-col p-6 overflow-hidden">
        <header className="w-full flex justify-between items-center mb-5 px-1">
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
              当前工作舱
            </span>
            <h2 className="text-lg font-bold text-slate-800 mt-0.5">{TAB_TITLES[activeTab]}</h2>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-100 shadow-sm px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            AI 内核就绪
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
