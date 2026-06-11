// src/renderer/src/pages/games/NailPuller.tsx
import React, { useRef, useEffect, useState } from 'react'
import { RefreshCw, Hammer, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

// 🌟 核心优化 (5): 针对学生群体量身定制的“高压学业焦虑库”
const STRESS_POOL = [
  { label: '挂科 🙅‍♂️', color: '#ef4444' },
  { label: '期末考 📝', color: '#f97316' },
  { label: '早八 🥱', color: '#64748b' },
  { label: '补作业 ✍️', color: '#3b82f6' },
  { label: '看排名 📊', color: '#ec4899' },
  { label: '错题 ❌', color: '#10b981' },
  { label: '卷王 🌀', color: '#8b5cf6' }
]

interface Nail {
  id: number
  x: number
  y: number
  baseX: number
  baseY: number
  pulled: boolean
  color: string
  label: string
}

const TOTAL_NAILS = 8

export default function NailPuller() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pulledCount, setPulledCount] = useState(0)
  const nailsRef = useRef<Nail[]>([])

  // 拖拽核心变量
  const activeNailIdRef = useRef<number | null>(null)
  const mousePosRef = useRef({ x: 0, y: 0 })
  const screenShakeRef = useRef(0) // 屏幕断裂震动系数

  // 生成解压钉子矩阵
  const generateNails = (): Nail[] => {
    const stressTemplates = [...STRESS_POOL]
    return Array.from({ length: TOTAL_NAILS }).map((_, i) => {
      const col = i % 4
      const row = Math.floor(i / 4)
      const rx = 80 + col * 130 + Math.random() * 30
      const ry = 90 + row * 120 + Math.random() * 30
      const template = stressTemplates[i % stressTemplates.length]
      return {
        id: i,
        x: rx,
        y: ry,
        baseX: rx,
        baseY: ry,
        pulled: false,
        color: template.color,
        label: template.label
      }
    })
  }

  const handleReset = () => {
    nailsRef.current = generateNails()
    setPulledCount(0)
    activeNailIdRef.current = null
  }

  useEffect(() => {
    handleReset()
  }, [])

  // 物理渲染主循环
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 🌟 核心调优 (5): 处理爆裂震动特效
      ctx.save()
      if (screenShakeRef.current > 0) {
        const dx = (Math.random() - 0.5) * screenShakeRef.current
        const dy = (Math.random() - 0.5) * screenShakeRef.current
        ctx.translate(dx, dy)
        screenShakeRef.current *= 0.85
        if (screenShakeRef.current < 0.5) screenShakeRef.current = 0
      }

      const activeId = activeNailIdRef.current

      nailsRef.current.forEach((n) => {
        if (n.pulled) return

        // 如果是被拖拽着的钉子
        if (n.id === activeId) {
          const targetX = mousePosRef.current.x
          const targetY = mousePosRef.current.y

          // 🌟 核心调优 (5): 降低拉扯力，采用缓动跟随，拉拉扯扯不再“硬邦邦”
          n.x += (targetX - n.x) * 0.45
          n.y += (targetY - n.y) * 0.45

          // 计算当前拉出延展距离
          const dist = Math.hypot(n.x - n.baseX, n.y - n.baseY)

          // 🌟 核心调优 (5): 大幅降低断裂判定临界，拉出 70px 即可“脆断”拔除
          if (dist > 70) {
            n.pulled = true
            activeNailIdRef.current = null
            setPulledCount((prev) => {
              const next = prev + 1
              if (next === TOTAL_NAILS) {
                setTimeout(
                  () => confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }),
                  200
                )
              }
              return next
            })

            // 🌟 核心调优 (5): 爆裂震动反馈 (10级物理强震)
            screenShakeRef.current = 10
            if (navigator.vibrate) navigator.vibrate([40, 20, 40])

            // 边缘粒子烟花爆开
            confetti({
              particleCount: 20,
              spread: 60,
              colors: [n.color, '#ffffff'],
              origin: { x: n.x / canvas.width, y: n.y / canvas.height }
            })
            return
          }
        } else {
          // 松手弹性恢复：像乳胶皮筋一样柔顺缩回原位
          n.x += (n.baseX - n.x) * 0.25
          n.y += (n.baseY - n.y) * 0.25
        }

        const pullDist = Math.hypot(n.x - n.baseX, n.y - n.baseY)

        // 🎨 绘制具有高度紧绷变形张力的橡皮筋
        ctx.beginPath()
        ctx.moveTo(n.baseX, n.baseY)
        ctx.lineTo(n.x, n.y)
        ctx.strokeStyle = n.color
        // 🌟 核心调优 (5): 紧绷时线条由粗变细，传达真实的张力感
        ctx.lineWidth = Math.max(2, 7 - pullDist * 0.05)
        ctx.lineCap = 'round'
        ctx.shadowBlur = 8
        ctx.shadowColor = n.color
        ctx.stroke()
        ctx.shadowBlur = 0 // 重置阴影

        // 🎨 绘制具有拟物化汉字高压的钉帽
        ctx.save()
        ctx.translate(n.x, n.y)
        // 钉帽稍微随拉扯方向倾斜，更有视觉张力
        if (n.id === activeId) {
          ctx.rotate(Math.atan2(n.y - n.baseY, n.x - n.baseX))
        }

        ctx.beginPath()
        ctx.arc(0, 0, 14, 0, Math.PI * 2)
        ctx.fillStyle = n.id === activeId ? '#ffffff' : n.color
        ctx.fill()
        ctx.strokeStyle = n.id === activeId ? n.color : '#ffffff'
        ctx.lineWidth = 3
        ctx.stroke()

        // 绘制钉子上的学业高压标签 (汉字 Emoji 居中)
        ctx.font = 'bold 11px sans-serif'
        ctx.fillStyle = n.id === activeId ? n.color : '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(n.label, 0, 0)
        ctx.restore()
      })

      ctx.restore()
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [])

  // 获取精准画布鼠标坐标
  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    }
  }

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCanvasPos(e)

    // 🌟 核心调优 (5): 将钉子的点按激活碰撞箱半径大幅调大至 30px，再也不会滑手点漏
    let closestNail: Nail | null = null
    let minDist = 30

    nailsRef.current.forEach((n) => {
      if (n.pulled) return
      const d = Math.hypot(pos.x - n.x, pos.y - n.y)
      if (d < minDist) {
        minDist = d
        closestNail = n
      }
    })

    if (closestNail) {
      activeNailIdRef.current = (closestNail as Nail).id
      mousePosRef.current = pos
    }
  }

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (activeNailIdRef.current === null) return
    mousePosRef.current = getCanvasPos(e)
  }

  const onUp = () => {
    activeNailIdRef.current = null
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-xl text-xs font-black tracking-wider flex items-center gap-1.5 shadow-2xs border border-amber-200">
            <Hammer size={13} className="text-amber-600 animate-swing" />
            解压进度 (连根拔起):{' '}
            <span className="font-mono text-sm text-rose-600">{pulledCount}</span> / {TOTAL_NAILS}{' '}
            颗
          </div>
          {pulledCount === TOTAL_NAILS && (
            <div className="text-emerald-600 text-xs font-bold flex items-center gap-1 animate-bounce">
              <Sparkles size={12} />
              焦虑全消，超级轻松！
            </div>
          )}
        </div>
        <button
          onClick={handleReset}
          title="重新布置焦虑钉子"
          className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer transition-all active:scale-95 shadow-3xs"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex-1 bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden relative shadow-inner min-h-[380px]">
        <canvas
          ref={canvasRef}
          width={600}
          height={380}
          className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        />
        {pulledCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <p className="text-slate-700 font-black text-[11px] tracking-widest uppercase animate-pulse">
              ➔ 鼠标拖动圆形钉帽向外狠拽，拉足深度即可脆断“解压爆炸” ➔
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
