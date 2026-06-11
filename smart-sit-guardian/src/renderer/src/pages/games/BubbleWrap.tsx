// src/renderer/src/pages/games/BubbleWrap.tsx
import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { RefreshCw } from 'lucide-react'

interface Bubble {
  id: number
  x: number
  y: number
  size: number
  color: string
  popped: boolean
}

const COLORS = [
  'bg-pink-300',
  'bg-blue-300',
  'bg-emerald-300',
  'bg-amber-300',
  'bg-purple-300',
  'bg-rose-300'
]
const LEVELS = [
  { label: 'S — 36颗', count: 36 },
  { label: 'M — 72颗', count: 72 },
  { label: 'L — 144颗', count: 144 }
]

function gen(count: number): Bubble[] {
  // 网格布局避免重叠
  const cols = Math.ceil(Math.sqrt(count * 1.6))
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: ((i % cols) / cols) * 90 + 2 + Math.random() * 3,
    y: (Math.floor(i / cols) / Math.ceil(count / cols)) * 85 + 3 + Math.random() * 3,
    size: 36 + Math.random() * 16,
    color: COLORS[i % COLORS.length],
    popped: false
  }))
}

export default function BubbleWrap() {
  const [level, setLevel] = useState(0)
  const [bubbles, setBubbles] = useState<Bubble[]>(() => gen(LEVELS[0].count))

  const pop = useCallback((b: Bubble) => {
    if (b.popped) return
    setBubbles((prev) => prev.map((p) => (p.id === b.id ? { ...p, popped: true } : p)))
    confetti({
      particleCount: 8,
      spread: 30,
      origin: { x: b.x / 100, y: b.y / 100 },
      colors: ['#F472B6', '#60A5FA', '#34D399', '#FBBF24']
    })
  }, [])

  const reset = (idx: number) => {
    setLevel(idx)
    setBubbles(gen(LEVELS[idx].count))
  }

  const popped = bubbles.filter((b) => b.popped).length
  const total = bubbles.length

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* 顶栏 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {LEVELS.map((l, i) => (
            <button
              key={i}
              onClick={() => reset(i)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                level === i
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold text-slate-600">
            {popped} / {total}
          </span>
          <button
            onClick={() => reset(level)}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 气泡画布 */}
      <div
        className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-100 rounded-3xl relative overflow-hidden"
        style={{ minHeight: 360 }}
      >
        <AnimatePresence>
          {bubbles.map(
            (b) =>
              !b.popped && (
                <motion.div
                  key={b.id}
                  className={`absolute rounded-full cursor-pointer ${b.color} opacity-75 hover:opacity-100`}
                  style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.size, height: b.size }}
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.7 }}
                  exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
                  onMouseEnter={() => pop(b)}
                  onClick={() => pop(b)}
                >
                  <div className="absolute top-1 left-1 w-2.5 h-1.5 bg-white/40 rounded-full -rotate-12" />
                </motion.div>
              )
          )}
        </AnimatePresence>

        {popped === total && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm"
          >
            <span className="text-4xl mb-3">✨</span>
            <h3 className="font-bold text-slate-800">全部爆完啦！</h3>
            <p className="text-sm text-slate-400 mt-1">压力已随气泡消散</p>
            <button
              onClick={() => reset(level)}
              className="mt-4 px-5 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold"
            >
              再来一轮
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
