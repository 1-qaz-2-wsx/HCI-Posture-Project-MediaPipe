import React from 'react'
import { motion } from 'framer-motion'
import { LayoutDashboard, CheckSquare, Timer, User, Gamepad2, Shield } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  icon: React.ComponentType<{ size: number }>
}

interface SidebarProps {
  activeTab: string
  setActiveTab: (id: string) => void
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems: MenuItem[] = [
    { id: 'dashboard', name: '健康看板', icon: LayoutDashboard },
    { id: 'todo', name: '待办清单', icon: CheckSquare },
    { id: 'pomodoro', name: '效率番茄', icon: Timer },
    { id: 'profile', name: '我的数据', icon: User },
    { id: 'game', name: '解压舱', icon: Gamepad2 }
  ]

  return (
    <div className="w-64 h-full bg-white flex flex-col p-6 border-r border-slate-100 select-none">
      {/* 头部高级系统 Logo */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-9 h-9 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-100">
          <Shield size={20} className="animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-base text-slate-800 tracking-tight">智慧坐姿卫士</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
            Posture Guardian
          </p>
        </div>
      </div>

      {/* 导航核心菜单 */}
      <div className="flex flex-col gap-2 relative">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium transition-colors relative z-10 ${
                isActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={18} />
              <span>{item.name}</span>

              {/* 液体动态高亮指示器*/}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 bg-emerald-50/60 rounded-2xl -z-10 border border-emerald-100/50"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* 底部贴心小助手看板 */}
      <div className="mt-auto bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <div className="text-xs font-semibold text-slate-600 mb-1">📋 科学交互提示</div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          根据工效学模型，学生群体建议每 45 分钟起立活动，或使用解压舱进行手势微休息。
        </p>
      </div>
    </div>
  )
}
