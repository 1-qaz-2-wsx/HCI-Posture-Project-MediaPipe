// src/renderer/src/components/Sidebar.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, CheckSquare, User, Shield, Zap, Gamepad2 } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  sub: string
  icon: React.ComponentType<{ size: number }>
}

interface SidebarProps {
  activeTab: string
  setActiveTab: (id: string) => void
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems: MenuItem[] = [
    { id: 'dashboard', name: '坐姿看板', sub: '实时骨骼检测', icon: LayoutDashboard },
    { id: 'focus', name: '专注舱', sub: '番茄 + 任务 + 坐姿', icon: Zap },
    { id: 'relax', name: '解压舱', sub: '三款解压小游戏', icon: Gamepad2 },
    { id: 'profile', name: '健康档案', sub: '数据与成就', icon: User },
    { id: 'todo', name: '待办清单', sub: '任务管理', icon: CheckSquare }
  ]

  return (
    <div className="w-60 h-full bg-white flex flex-col p-5 border-r border-slate-100 select-none shrink-0">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-9 h-9 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-100">
          <Shield size={18} className="animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-slate-800 tracking-tight">智慧坐姿卫士</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
            Posture Guardian
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 relative">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors relative z-10 ${
                isActive ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'
                }`}
              >
                <Icon size={16} />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">{item.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{item.sub}</div>
              </div>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 bg-emerald-50/70 rounded-2xl -z-10 border border-emerald-100/60"
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-auto bg-slate-50 border border-slate-100 rounded-2xl p-3.5">
        <div className="text-xs font-semibold text-slate-600 mb-1">📋 科学提示</div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          每 45 分钟起立活动，或前往解压舱进行手势微休息。
        </p>
      </div>
    </div>
  )
}
