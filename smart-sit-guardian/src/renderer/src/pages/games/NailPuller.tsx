// src/renderer/src/pages/games/NailPuller.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import confetti from 'canvas-confetti'

interface Nail {
  id: number
  x: number
  y: number
  pulled: boolean
  resistance: number
}

function genNails(count = 12): Nail[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: 80 + (i % 4) * 130 + Math.random() * 40,
    y: 80 + Math.floor(i / 4) * 120 + Math.random() * 40,
    pulled: false,
    resistance: 0.4 + Math.random() * 0.5
  }))
}

export default function NailPuller() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nailsRef = useRef<Nail[]>(genNails())
  const dragRef = useRef<{ nail: Nail | null; ox: number; oy: number; dx: number; dy: number }>({
    nail: null,
    ox: 0,
    oy: 0,
    dx: 0,
    dy: 0
  })
  const [pulled, setPulled] = useState(0)
  const [total] = useState(12)
  const animRef = useRef<number>(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const { nail, dx, dy } = dragRef.current
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const n of nailsRef.current) {
      if (n.pulled) continue

      const isDragging = nail?.id === n.id
      const ex = isDragging ? n.x + dx : n.x
      const ey = isDragging ? n.y + dy : n.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      // 橡皮筋（拖拽时）
      if (isDragging && dist > 5) {
        ctx.beginPath()
        ctx.moveTo(n.x, n.y)
        ctx.lineTo(ex, ey)
        ctx.strokeStyle = `rgba(239,68,68,${Math.min(dist / 80, 1)})`
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // 木板底座
      ctx.beginPath()
      ctx.arc(n.x, n.y, 18, 0, Math.PI * 2)
      ctx.fillStyle = '#d97706'
      ctx.fill()

      // 钉帽
      ctx.beginPath()
      ctx.arc(isDragging ? ex : n.x, isDragging ? ey : n.y, 10, 0, Math.PI * 2)
      ctx.fillStyle = isDragging ? '#ef4444' : '#9ca3af'
      ctx.fill()
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // 拉力指示
      if (isDragging && dist > 5) {
        ctx.font = 'bold 11px monospace'
        ctx.fillStyle = dist > n.resistance * 100 ? '#ef4444' : '#f59e0b'
        ctx.fillText(
          `${Math.min(Math.round((dist / (n.resistance * 100)) * 100), 100)}%`,
          ex + 14,
          ey - 8
        )
      }
    }
  }, [])

  useEffect(() => {
    const loop = () => {
      draw()
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current!)
  }, [draw])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const src = 'touches' in e ? (e as React.TouchEvent).touches[0] : (e as React.MouseEvent)
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getPos(e)
    for (const n of nailsRef.current) {
      if (n.pulled) continue
      if (Math.hypot(x - n.x, y - n.y) < 22) {
        dragRef.current = { nail: n, ox: x, oy: y, dx: 0, dy: 0 }
        return
      }
    }
  }

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragRef.current.nail) return
    const { x, y } = getPos(e)
    dragRef.current.dx = x - dragRef.current.ox
    dragRef.current.dy = y - dragRef.current.oy
  }

  const onUp = () => {
    const { nail, dx, dy } = dragRef.current
    if (!nail) return
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > nail.resistance * 100) {
      nail.pulled = true
      // 震动反馈
      if (navigator.vibrate) navigator.vibrate([40, 20, 40])
      confetti({
        particleCount: 30,
        spread: 60,
        origin: {
          x: nail.x / (canvasRef.current?.width || 600),
          y: nail.y / (canvasRef.current?.height || 400)
        },
        colors: ['#f59e0b', '#ef4444', '#8b5cf6']
      })
      const newCount = nailsRef.current.filter((n) => n.pulled).length
      setPulled(newCount)
      if (newCount === total) {
        setTimeout(() => confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } }), 200)
      }
    }
    dragRef.current = { nail: null, ox: 0, oy: 0, dx: 0, dy: 0 }
  }

  const reset = () => {
    nailsRef.current = genNails()
    setPulled(0)
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-slate-700">
            已拔出 {pulled} / {total} 颗钉子
          </span>
          <span className="text-xs text-slate-400 ml-2">拖拽钉帽，拉断橡皮筋</span>
        </div>
        <button
          onClick={reset}
          className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      <div
        className="flex-1 bg-amber-50/60 border border-amber-100 rounded-3xl overflow-hidden"
        style={{ minHeight: 360 }}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={380}
          className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        />
      </div>
    </div>
  )
}
