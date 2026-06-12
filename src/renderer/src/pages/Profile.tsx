// src/renderer/src/pages/Profile.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, ShieldCheck, Heart, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react'

export default function Profile() {
  const stats = [
    {
      label: '累计专注时长',
      value: '14.5 h',
      icon: <Clock size={18} />,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: '完美坐姿率',
      value: '88 %',
      icon: <ShieldCheck size={18} />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: '脊椎疲劳警告',
      value: '2 次',
      icon: <AlertTriangle size={18} />,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: '今日健康评分',
      value: '94 分',
      icon: <Heart size={18} />,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    }
  ]

  const badges = [
    { title: '初级心流学者', desc: '累计完成 5 个专注番茄钟', icon: '🥉', unlocked: true },
    { title: '端正标兵', desc: '单次专注完美坐姿保持 90% 以上', icon: '👑', unlocked: true },
    { title: '正念大师', desc: '连续 3 天完成坐姿与微休息闭环', icon: '💎', unlocked: false }
  ]

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col select-none gap-8">
      {/* 4象限核心健康流卡片组 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between h-28 hover:bg-white hover:shadow-md hover:border-slate-200/60 transition-all"
          >
            <div
              className={`w-9 h-9 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}
            >
              {stat.icon}
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800 font-mono leading-none">
                {stat.value}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1.5">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 底部：勋章墙与近期诊断报告 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 flex-1">
        {/* 左侧：健康勋章墙 */}
        <div className="md:col-span-3 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 px-1">
            <Trophy size={15} className="text-amber-500" />
            <span>荣誉行为勋章墙</span>
          </h3>

          <div className="flex-1 bg-slate-50/30 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
            {badges.map((badge, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                  badge.unlocked
                    ? 'bg-white border-slate-100 text-slate-700 shadow-xs'
                    : 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <span className="text-2xl">{badge.icon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-800">{badge.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{badge.desc}</p>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                  {badge.unlocked ? '已解锁' : '未达成'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：AI 长期诊断建议卡片 */}
        <div className="md:col-span-2 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-700 px-1">📊 近期智能医学诊断</h3>
          <div className="flex-1 bg-gradient-to-b from-blue-50/20 to-indigo-50/20 border border-blue-100/40 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-blue-500 tracking-wider uppercase">
                智能脊椎卫士建议
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                “你在下午 14:00 - 16:00
                期间容易出现明显的头部前倾趋势（Z轴偏差变大）。建议调高显示器支架高度 3
                厘米，或在番茄钟休息期间主动进行颈部拉伸。”
              </p>
            </div>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white border border-blue-100 px-4 py-2.5 rounded-xl shadow-xs transition-colors mt-4"
            >
              <span>查看周度多维行为报告</span>
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
