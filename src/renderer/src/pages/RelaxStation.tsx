// src/renderer/src/pages/RelaxStation.tsx
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import BubbleWrap from './games/BubbleWrap'
import GestureFireworks from './games/GestureFireworks'
import NailPuller from './games/NailPuller'

interface RelaxStationProps {
  onCameraToGame: () => void
  onCameraToPosture: () => void
  cameraOwner: 'posture' | 'game'
}

type GameId = 'bubble' | 'gesture' | 'nail' | null

const GAMES = [
  {
    id: 'bubble' as GameId,
    name: '泡泡纸',
    emoji: '🫧',
    desc: '随机泡泡，悬停即爆，选三个挡位',
    color: 'from-pink-50 to-rose-50',
    border: 'border-pink-100',
    badge: 'bg-pink-100 text-pink-700'
  },
  {
    id: 'gesture' as GameId,
    name: '手势烟花',
    emoji: '🎆',
    desc: '用手指在摄像头前挥动，触发烟花',
    color: 'from-indigo-50 to-purple-50',
    border: 'border-indigo-100',
    badge: 'bg-indigo-100 text-indigo-700'
  },
  {
    id: 'nail' as GameId,
    name: '拆钉子',
    emoji: '🔨',
    desc: '拖拽橡皮筋，弹力拔出图钉，减压神器',
    color: 'from-amber-50 to-orange-50',
    border: 'border-amber-100',
    badge: 'bg-amber-100 text-amber-700'
  }
]

export default function RelaxStation({}: RelaxStationProps) {
  const [activeGame, setActiveGame] = useState<GameId>(null)

  const enterGame = (id: GameId) => {
    // 手势游戏：让 Python 切换到手势检测模式，不需要释放摄像头
    // GestureFireworks 组件内部的 useEffect 会自动调用 api.switchToGesture()
    setActiveGame(id)
  }

  const exitGame = () => {
    // GestureFireworks 的 useEffect 清理函数会自动调用 api.switchToPosture()
    setActiveGame(null)
  }

  return (
    <div className="h-full flex flex-col select-none">
      <AnimatePresence mode="wait">
        {activeGame === null ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col gap-6 max-w-2xl mx-auto w-full"
          >
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800">选一个解压小游戏</h2>
              <p className="text-sm text-slate-400 mt-1">休息五分钟，让大脑真正放松</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {GAMES.map((g) => (
                <motion.button
                  key={g.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => enterGame(g.id)}
                  className={`bg-gradient-to-r ${g.color} border ${g.border} rounded-3xl p-5 flex items-center gap-5 text-left transition-shadow hover:shadow-md`}
                >
                  <span className="text-4xl">{g.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 text-base">{g.name}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{g.desc}</div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${g.badge}`}>
                    开始
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={activeGame}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col gap-4"
          >
            <button
              onClick={() => exitGame()}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 w-fit"
            >
              <ArrowLeft size={14} />
              <span>返回游戏列表</span>
            </button>
            {activeGame === 'bubble' && <BubbleWrap />}
            {activeGame === 'gesture' && <GestureFireworks />}
            {activeGame === 'nail' && <NailPuller />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
