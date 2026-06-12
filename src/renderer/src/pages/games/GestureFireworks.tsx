// src/renderer/src/pages/games/GestureFireworks.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react'
import confetti from 'canvas-confetti'

const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17]
]

interface Landmark {
  x: number
  y: number
  z: number
}
interface GestureFrame {
  type: 'gesture'
  hands: Landmark[][]
  image: string
}

// 判断手是否张开：五根手指末端都高于（y更小）各自的指根
function isHandOpen(lms: Landmark[]): boolean {
  // 拇指：横向判断，末端 x 离掌心更远
  // 其余四指：纵向判断，末端 y 更小（更靠近屏幕顶部）
  const thumbOpen = Math.abs(lms[4].x - lms[2].x) > 0.06
  const indexOpen = lms[8].y < lms[6].y
  const middleOpen = lms[12].y < lms[10].y
  const ringOpen = lms[16].y < lms[14].y
  const pinkyOpen = lms[20].y < lms[18].y
  return thumbOpen && indexOpen && middleOpen && ringOpen && pinkyOpen
}

export default function GestureFireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(new Image())
  const lastFire = useRef<number>(0)
  const [ready, setReady] = useState(false)
  const [tip, setTip] = useState('正在启动手势检测...')
  // 当前是否检测到张开的手，用于 UI 反馈
  const [openHands, setOpenHands] = useState(0)

  const drawHands = useCallback(
    (ctx: CanvasRenderingContext2D, hands: Landmark[][], w: number, h: number) => {
      let openCount = 0

      for (const landmarks of hands) {
        const open = isHandOpen(landmarks)
        if (open) openCount++

        // 张开的手用白色高亮，握拳/其他手势用灰色
        const lineColor = open ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)'
        const dotColor = open ? '#ffffff' : 'rgba(255,255,255,0.3)'

        ctx.strokeStyle = lineColor
        ctx.lineWidth = open ? 2 : 1
        for (const [a, b] of HAND_CONNECTIONS) {
          ctx.beginPath()
          ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h)
          ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h)
          ctx.stroke()
        }

        for (const lm of landmarks) {
          ctx.beginPath()
          ctx.arc(lm.x * w, lm.y * h, open ? 5 : 3, 0, Math.PI * 2)
          ctx.fillStyle = dotColor
          ctx.fill()
        }

        // 只有张开手才触发烟花，冷却 600ms（避免持续张手刷屏）
        if (open) {
          const now = Date.now()
          if (now - lastFire.current > 600) {
            lastFire.current = now
            // 用手掌中心（第9点，中指根部）作为烟花位置
            const palm = landmarks[9]
            confetti({
              particleCount: 100,
              spread: 120,
              origin: { x: palm.x, y: palm.y },
              colors: ['#FF6B9D', '#A78BFA', '#60A5FA', '#34D399', '#FBBF24', '#FF8C42']
            })
            // 同时从手掌位置再发一波小烟花增强效果
            setTimeout(() => {
              confetti({
                particleCount: 40,
                spread: 60,
                origin: { x: palm.x, y: palm.y },
                startVelocity: 20,
                gravity: 0.8,
                colors: ['#fff', '#FFD700']
              })
            }, 150)
          }
        }
      }

      setOpenHands(openCount)
    },
    []
  )

  useEffect(() => {
    const api = (window as any).api
    if (!api) return

    api.switchToGesture?.()
    setReady(true)
    setTip('张开手掌触发烟花 🎆  握拳或其他手势无效')

    api.onGestureData((frame: GestureFrame) => {
      const canvas = canvasRef.current
      if (!canvas || !frame.image) return
      const ctx = canvas.getContext('2d')!
      const w = canvas.width
      const h = canvas.height

      imgRef.current.onload = () => {
        ctx.clearRect(0, 0, w, h)
        ctx.drawImage(imgRef.current, 0, 0, w, h)
        if (frame.hands?.length > 0) {
          drawHands(ctx, frame.hands, w, h)
        } else {
          setOpenHands(0)
        }
      }
      imgRef.current.src = frame.image
    })

    return () => {
      api.switchToPosture?.()
      api.removeGestureListener?.()
    }
  }, [drawHands])

  return (
    <div className="flex-1 flex flex-col gap-3">
      {/* 状态提示 */}
      <div className="flex items-center justify-center gap-3">
        <p className={`text-sm font-medium ${ready ? 'text-emerald-600' : 'text-slate-400'}`}>
          {tip}
        </p>
        {/* 实时手势状态指示 */}
        {ready && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
              openHands > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <span>{openHands > 0 ? '🖐️' : '✊'}</span>
            <span>{openHands > 0 ? `检测到 ${openHands} 只张开的手` : '未检测到张开手势'}</span>
          </div>
        )}
      </div>

      <div
        className="flex-1 relative rounded-3xl overflow-hidden bg-slate-900"
        style={{ minHeight: 360 }}
      >
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white/50 text-xs">正在切换到手势检测模式...</p>
          </div>
        )}
        {/* 张开手时的全屏光晕提示 */}
        {openHands > 0 && (
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{ boxShadow: 'inset 0 0 40px rgba(255,255,255,0.15)' }}
          />
        )}
      </div>

      {/* 底部使用说明 */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
        <span>🖐️ 张开手掌 → 触发烟花</span>
        <span>✊ 握拳 → 无效果</span>
        <span>🤞 其他手势 → 无效果</span>
      </div>
    </div>
  )
}
