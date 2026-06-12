// src/renderer/src/pages/games/NailPuller.tsx
import React, { useRef, useEffect, useState } from 'react'
import { RefreshCw, Hammer, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

// 🌟 清新健康体态/心理舒压库（使用深饱和度的高清晰度治愈色彩契约）
// 🌟 清新健康体态/心理舒压库（替换重度焦虑，采用更积极治愈的文案）

const CONCENTRATE_POOL = [
  { label: '挂科 🙅‍♂️', color: '#f43f5e' }, // 玫瑰粉红

  { label: '期末考 📝', color: '#fb923c' }, // 暖橙

  { label: '作业 ✍️', color: '#60a5fa' }, // 治愈蓝

  { label: '内耗 😫', color: '#a78bfa' }, // 柔和紫

  { label: '早八 🥱', color: '#fbbf24' }, // 阳光黄

  { label: '内卷 🌀', color: '#f472b6' }, // 甜美粉

  { label: '焦虑 🫧', color: '#34d399' } // 薄荷绿
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

const LEVELS = [
  { label: 'S — 8颗', count: 8 },
  { label: 'M — 16颗', count: 16 },
  { label: 'L — 32颗', count: 32 }
]
// 🌟 核心定制 (1): 精心调试的高对比、可爱风【黄色悬停手势 SVG】
const YELLOW_GRAB_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='%23eab308' stroke='%23854d0e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5'/><path d='M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v6'/><path d='M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8.5'/><path d='M18 11a2 2 0 0 1 2 2v3a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7v-3a2 2 0 0 1 2-2v2'/></svg>") 12 12, auto`

// 🌟 核心定制 (2): 精心调试的高对比、可爱风【黄色狠狠抓取握拳 SVG】
const YELLOW_GRABBING_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='%23eab308' stroke='%23854d0e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M18 11V9a1 1 0 0 0-1-1v0a1 1 0 0 0-1 1v2'/><path d='M14 10V7a1 1 0 0 0-1-1v0a1 1 0 0 0-1 1v3'/><path d='M10 10.5V8a1 1 0 0 0-1-1v0a1 1 0 0 0-1 1v2.5'/><path d='M6 13V11a1 1 0 0 0-1-1v0a1 1 0 0 0-1 1v5.5'/><path d='M18 11a2 2 0 0 1 2 2v3a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7v-3'/></svg>") 12 12, auto`

export default function NailPuller() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [levelIndex, setLevelIndex] = useState(0)
  const totalNails = LEVELS[levelIndex].count

  const [pulledCount, setPulledCount] = useState(0)
  const nailsRef = useRef<Nail[]>([])

  // 拖拽核心变量
  const activeNailIdRef = useRef<number | null>(null)
  const mousePosRef = useRef({ x: 0, y: 0 })
  const screenShakeRef = useRef(0)
  const [hoveringNail, setHoveringNail] = useState(false) // 🌟 驱动高性能自定义鼠标样式

  const generateNails = (count: number): Nail[] => {
    const pool = [...CONCENTRATE_POOL]
    const cols = count === 8 ? 4 : count === 16 ? 4 : 8

    return Array.from({ length: count }).map((_, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)

      const hGap = count === 32 ? 65 : 130
      const vGap = count === 32 ? 75 : 110
      const startX = count === 32 ? 45 : 85
      const startY = count === 32 ? 60 : 95

      const rx = startX + col * hGap + (Math.random() - 0.5) * 15
      const ry = startY + row * vGap + (Math.random() - 0.5) * 15
      const template = pool[i % pool.length]

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
    nailsRef.current = generateNails(totalNails)
    setPulledCount(0)
    activeNailIdRef.current = null
    setHoveringNail(false)
  }

  useEffect(() => {
    handleReset()
  }, [levelIndex])

  // 物理渲染主循环
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

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

        if (n.id === activeId) {
          const targetX = mousePosRef.current.x
          const targetY = mousePosRef.current.y

          n.x += (targetX - n.x) * 0.45
          n.y += (targetY - n.y) * 0.45

          const dist = Math.hypot(n.x - n.baseX, n.y - n.baseY)

          if (dist > 70) {
            n.pulled = true
            activeNailIdRef.current = null
            setPulledCount((prev) => {
              const next = prev + 1
              if (next === totalNails) {
                setTimeout(
                  () => confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }),
                  200
                )
              }
              return next
            })

            screenShakeRef.current = 10
            if (navigator.vibrate) navigator.vibrate([40, 20, 40])

            confetti({
              particleCount: 25,
              spread: 60,
              colors: [n.color, '#ffffff'],
              origin: { x: n.x / canvas.width, y: n.y / canvas.height }
            })
            return
          }
        } else {
          n.x += (n.baseX - n.x) * 0.25
          n.y += (n.baseY - n.y) * 0.25
        }

        const pullDist = Math.hypot(n.x - n.baseX, n.y - n.baseY)

        // 🎨 绘制高质感软糯橡皮筋
        ctx.beginPath()
        ctx.moveTo(n.baseX, n.baseY)
        ctx.lineTo(n.x, n.y)
        ctx.strokeStyle = n.color
        ctx.lineWidth = Math.max(2.5, 7.5 - pullDist * 0.06)
        ctx.lineCap = 'round'
        ctx.shadowBlur = 4
        ctx.shadowColor = n.color
        ctx.stroke()
        ctx.shadowBlur = 0

        // 🎨 绘制改良版：白底高对比拟物圆润钉帽
        ctx.save()
        ctx.translate(n.x, n.y)
        if (n.id === activeId) {
          ctx.rotate(Math.atan2(n.y - n.baseY, n.x - n.baseX))
        }

        // 软萌半透明环境阴影，增强立体悬浮感
        ctx.shadowColor = 'rgba(15, 23, 42, 0.12)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetY = 5

        ctx.beginPath()
        const radius = totalNails === 32 ? 11 : 15
        ctx.arc(0, 0, radius, 0, Math.PI * 2)

        // 🌟 修改点：平时采用纯白填充，激活时转为彩色填充，确保背景与层次分明
        ctx.fillStyle = n.id === activeId ? n.color : '#ffffff'
        ctx.fill()

        ctx.strokeStyle = n.id === activeId ? '#ffffff' : n.color
        ctx.lineWidth = totalNails === 32 ? 2.5 : 3.5
        ctx.stroke()
        ctx.shadowColor = 'transparent' // 卸载阴影

        // 🌟 修改点：字标颜色动态反转。平时文字用专属饱满彩色，拉动时用白色，100% 极清
        const fontSize = totalNails === 32 ? '9px' : '11px'
        ctx.font = `bold ${fontSize} sans-serif`
        ctx.fillStyle = n.id === activeId ? '#ffffff' : n.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const showLabel =
          totalNails === 32 ? n.label.replace(/[\u4e00-\u9fa5]/g, '').trim() : n.label
        ctx.fillText(showLabel, 0, totalNails === 32 ? 1 : 0)
        ctx.restore()
      })

      ctx.restore()
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [totalNails])

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

  // 检测鼠标当前是否正悬停在某颗未拔掉的钉子上
  const checkHover = (pos: { x: number; y: number }) => {
    let isOver = false
    const limit = totalNails === 32 ? 22 : 32
    nailsRef.current.forEach((n) => {
      if (!n.pulled && Math.hypot(pos.x - n.x, pos.y - n.y) < limit) {
        isOver = true
      }
    })
    setHoveringNail(isOver)
  }

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getCanvasPos(e)
    let closestNail: Nail | null = null
    let minDist = totalNails === 32 ? 22 : 32

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
    const pos = getCanvasPos(e)
    checkHover(pos)
    if (activeNailIdRef.current === null) return
    mousePosRef.current = pos
  }

  const onUp = () => {
    activeNailIdRef.current = null
  }

  // // 🌟 鼠标样式动态调度机
  // const getCursorClass = () => {
  //   if (activeNailIdRef.current !== null) return 'cursor-grabbing select-none' // 正在狠抓
  //   if (hoveringNail) return 'cursor-grab' // 悬停小手
  //   return 'cursor-default' // 普通空白区
  // }

  // 🌟 核心定制 (3): 智能化动态调度黄色 SVG 指针样式
  const getCursorStyle = () => {
    if (activeNailIdRef.current !== null) return { cursor: YELLOW_GRABBING_CURSOR } // 正在狠抓（拳头）
    if (hoveringNail) return { cursor: YELLOW_GRAB_CURSOR } // 悬停在钉子上（张开小手）
    return { cursor: 'default' } // 空白区域
  }

  return (
    <div className="flex-1 flex flex-col gap-4 select-none">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50/60 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-black tracking-wider flex items-center gap-1.5 border border-emerald-100/70 shadow-3xs">
            <Hammer size={13} className="text-emerald-500 animate-bounce" />
            拔除进度：
            <span className="font-mono text-sm text-emerald-600">{pulledCount}</span> / {totalNails}{' '}
            颗
          </div>
          {pulledCount === totalNails && (
            <div className="text-emerald-600 text-xs font-bold flex items-center gap-1 animate-bounce">
              <Sparkles size={12} />
              体态隐患全拔除，好轻松！
            </div>
          )}
        </div>

        {/* 挡位控制 */}
        <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/40">
          {LEVELS.map((lvl, idx) => (
            <button
              key={lvl.label}
              onClick={() => setLevelIndex(idx)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                levelIndex === idx
                  ? 'bg-white text-emerald-600 shadow-3xs border border-slate-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {lvl.label.split('—')[0].trim()}
            </button>
          ))}

          <div className="w-[1px] h-4 bg-slate-200 mx-1" />

          <button
            onClick={handleReset}
            title="重新布置舒压板"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-all cursor-pointer"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* 主画布容器 */}
      <div className="flex-1 bg-amber-50/30 border border-amber-100/60 rounded-3xl overflow-hidden relative shadow-3xs min-h-[380px]">
        <div className="absolute inset-0 border-[12px] border-amber-100/15 pointer-events-none rounded-3xl" />

        <canvas
          ref={canvasRef}
          width={600}
          height={380}
          // 🌟 修改点：绑定智能化自定义动态指针，视觉冲击感极强且醒目
          // 🌟 核心定制 (4): 完美绑定内联的高动态黄色手势样式，并加上深色边框让它在淡色背景上极有存在感
          style={getCursorStyle()}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        />

        {pulledCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 px-6">
            <p className="text-amber-800/40 font-bold text-[10px] tracking-widest uppercase text-center leading-relaxed">
              ➔ 用小手鼠标拽住白色圆钉帽向外狠狠拉扯 ➔<br />
              拉足深度即可脆断，拔掉所有不健康因数！
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
