// src/renderer/src/pages/TodoList.tsx
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, CheckCircle2, Circle, Flame, Sparkles, Target } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Task, SharedTodoProps } from '../types'

interface TodoListProps extends SharedTodoProps {
  goToPomodoro: () => void
}

export default function TodoList({
  tasks,
  setTasks,
  activeTaskId,
  setActiveTaskId,
  goToPomodoro
}: TodoListProps) {
  // 🌟 注意：这里已经删掉了内部重复的 const [tasks, setTasks] = useState(...)
  const [input, setInput] = useState('')

  // 1. 添加任务逻辑
  const addTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      text: input.trim(),
      completed: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setTasks([newTask, ...tasks])
    setInput('')
  }

  // 2. 勾选任务状态
  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const nextState = !task.completed
          if (nextState) {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.75 },
              colors: ['#10B981', '#3B82F6', '#6EE7B7']
            })
            if (activeTaskId === id) setActiveTaskId(null) // 如果当前专注的任务被勾选完成，释放专注槽
          }
          return { ...task, completed: nextState }
        }
        return task
      })
    )
  }

  // 3. 删除任务逻辑
  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
    if (activeTaskId === id) setActiveTaskId(null)
  }

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col select-none">
      {/* 顶部学生效率数据看板 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Flame size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800 font-mono">
              {tasks.filter((t) => t.completed).length} / {tasks.length}
            </div>
            <div className="text-xs text-slate-400 font-medium">今日已解锁专注任务</div>
          </div>
        </div>
        <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800 font-mono">
              {tasks.length > 0
                ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)
                : 100}
              %
            </div>
            <div className="text-xs text-slate-400 font-medium">任务闭环达成率</div>
          </div>
        </div>
      </div>

      {/* 极简高级任务输入框 */}
      <form onSubmit={addTask} className="relative flex items-center mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="今天准备专注些什么任务？输入后回车..."
          className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-200 focus:bg-white rounded-2xl py-4 pl-5 pr-14 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="absolute right-3 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-100 transition-colors"
        >
          <Plus size={18} />
        </motion.button>
      </form>

      {/* 动态带过渡动画的任务列表区 */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {tasks.map((task) => {
            const isTargeted = activeTaskId === task.id
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  task.completed
                    ? 'bg-slate-50/40 border-slate-100/60 text-slate-400'
                    : isTargeted
                      ? 'bg-blue-50/40 border-blue-200 shadow-sm text-slate-800 ring-1 ring-blue-100'
                      : 'bg-white border-slate-100 shadow-sm hover:shadow-md text-slate-700'
                }`}
              >
                <div
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => toggleTask(task.id)}
                >
                  <motion.div whileTap={{ scale: 0.8 }} className="flex-shrink-0">
                    {task.completed ? (
                      <CheckCircle2 size={19} className="text-emerald-500 fill-emerald-50" />
                    ) : (
                      <Circle
                        size={19}
                        className="text-slate-300 group-hover:text-emerald-500 transition-colors"
                      />
                    )}
                  </motion.div>

                  <span
                    className={`text-sm font-medium leading-relaxed transition-all ${task.completed ? 'line-through opacity-60' : ''}`}
                  >
                    {task.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* HCI 交互核心按钮：一键带去番茄钟进行专注 */}
                  {!task.completed && (
                    <button
                      onClick={() => {
                        setActiveTaskId(isTargeted ? null : task.id)
                        if (!isTargeted) goToPomodoro() // 联动：自动帮用户跳到番茄钟切页
                      }}
                      className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium transition-all ${
                        isTargeted
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 group-hover:opacity-100 opacity-0'
                      }`}
                    >
                      <Target size={14} />
                      <span>{isTargeted ? '正在专注' : '去专注'}</span>
                    </button>
                  )}

                  <span className="text-[10px] font-mono text-slate-300 bg-slate-50 px-2 py-1 rounded-md group-hover:hidden">
                    {task.timestamp}
                  </span>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="text-center py-20 text-slate-300 font-light text-sm">
            🍃 所有专注任务已清空，给自己放个假或在上方添加新任务吧。
          </div>
        )}
      </div>
    </div>
  )
}
