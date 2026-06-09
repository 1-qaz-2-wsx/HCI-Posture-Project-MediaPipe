// src/renderer/src/pages/Game.tsx
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RefreshCw, Smile } from 'lucide-react'
import confetti from 'canvas-confetti'

interface Bubble {
  id: number
  x: number
  y: number
  size: number
  color: string
  popped: boolean
}

export default function Game() {
  const COLORS = [
    'bg-pink-400',
    'bg-blue-400',
    'bg-emerald-400',
    'bg-amber-400',
    'bg-indigo-400',
    'bg-purple-400'
  ]

  // 初始化 24 个充满弹性的泡泡矩阵
  const generateBubbles = (): Bubble[] => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 70 + 15,
      size: Math.random() * 25 + 45, // 随机大小
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      popped: false
    }))
  }

  const [bubbles, setBubbles] = useState<Bubble[]>(generateBubbles())

  const popBubble = (id: number) => {
    setBubbles((prev) =>
      prev.map((b) => {
        if (b.id === id && !b.popped) {
          // 轻量爆裂触觉反馈效果
          confetti({
            particleCount: 15,
            spread: 40,
            origin: { x: b.x / 100, y: b.y / 100 },
            colors: ['#F472B6', '#60A5FA', '#34D399', '#FBBF24']
          })
          return { ...b, popped: true }
        }
        return b
      })
    )
  }

  const resetGame = () => {
    setBubbles(generateBubbles())
  }

  const poppedCount = bubbles.filter((b) => b.popped).length

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col select-none">
      {/* 顶部解压看板 */}
      <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500 animate-bounce">
            <Smile size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800 font-mono">
              {poppedCount} / {bubbles.length}
            </div>
            <div className="text-xs text-slate-400 font-medium">正念呼吸间捏碎的焦虑气泡</div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetGame}
          className="p-3 bg-white border border-slate-100 hover:border-slate-200 text-slate-500 hover:text-slate-700 rounded-xl shadow-sm flex items-center gap-2 text-xs font-semibold transition-all"
        >
          <RefreshCw size={14} />
          <span>重新铺满</span>
        </motion.button>
      </div>

      {/* 极轻量子互动沙盒区 */}
      <div className="flex-1 bg-gradient-to-br from-slate-50/30 to-slate-100/20 border border-slate-100 rounded-3xl relative overflow-hidden p-6 min-h-[400px]">
        <AnimatePresence>
          {bubbles.map((bubble) => (
            <motion.div
              key={bubble.id}
              className={`absolute rounded-full cursor-pointer shadow-sm flex items-center justify-center ${bubble.color} ${
                bubble.popped
                  ? 'opacity-0 scale-0 pointer-events-none'
                  : 'opacity-80 hover:opacity-100'
              }`}
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: `${bubble.size}px`,
                height: `${bubble.size}px`
              }}
              whileHover={{
                scale: 1.15,
                y: -4,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
              }}
              whileTap={{ scale: 0.8 }}
              onMouseEnter={() => popBubble(bubble.id)} // 悬浮划过即可触发捏碎
              onClick={() => popBubble(bubble.id)} // 点击也能触发
              layout
            >
              {/* 气泡表面的微反光（增强苹果风立体感） */}
              <div className="absolute top-1.5 left-1.5 w-3 h-1.5 bg-white/40 rounded-full transform -rotate-12" />
            </motion.div>
          ))}
        </AnimatePresence>

        {poppedCount === bubbles.length && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white/60 backdrop-blur-xs"
          >
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-3">
              <Sparkles size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800">内心重归平静</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              焦虑与压力已随气泡消散，起立舒展一下身体，准备迎接下一轮的高效专注吧。
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
