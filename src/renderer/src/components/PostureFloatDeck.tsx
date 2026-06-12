// src/renderer/src/components/PostureFloatDeck.tsx
import React, { useState, useEffect, useRef } from 'react'
import { GripHorizontal, Minus, Maximize2, X, Video } from 'lucide-react'

interface PostureFloatDeckProps {
  imgSrc: string | null
  statusColor: 'green' | 'orange' | 'red'
  isDashboard: boolean // 进入坐姿看板时自动折叠并靠左
  onClose: () => void
}

export default function PostureFloatDeck({
  imgSrc,
  statusColor,
  isDashboard,
  onClose
}: PostureFloatDeckProps) {
  const [position, setPosition] = useState({ x: 740, y: 80 })
  const [size, setSize] = useState({ width: 230, height: 190 })
  const [isMinimized, setIsMinimized] = useState(false)

  const isDragging = useRef(false)
  const isResizing = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 })
  const resizeDir = useRef('')
  const containerRef = useRef<HTMLDivElement>(null)

  // 进入坐姿看板时自动折叠到左上方
  useEffect(() => {
    if (isDashboard) {
      setIsMinimized(true)
      setPosition({ x: 8, y: 80 })
    }
  }, [isDashboard])

  // 全局鼠标事件
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDragging.current) {
        setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
      } else if (isResizing.current) {
        const dx = e.clientX - resizeStart.current.x
        const dy = e.clientY - resizeStart.current.y
        const dir = resizeDir.current
        let nw = resizeStart.current.w,
          nh = resizeStart.current.h
        let nx = resizeStart.current.px,
          ny = resizeStart.current.py
        if (dir.includes('e')) nw = resizeStart.current.w + dx
        if (dir.includes('s')) nh = resizeStart.current.h + dy
        if (dir.includes('w')) {
          nw = resizeStart.current.w - dx
          nx = resizeStart.current.px + dx
        }
        if (dir.includes('n')) {
          nh = resizeStart.current.h - dy
          ny = resizeStart.current.py + dy
        }
        setSize({
          width: Math.max(180, Math.min(nw, 450)),
          height: Math.max(140, Math.min(nh, 380))
        })
        setPosition({ x: nx, y: ny })
      }
    }
    const onUp = () => {
      isDragging.current = false
      isResizing.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  // 拖拽：整个容器任意位置都可拖
  const onContainerMouseDown = (e: React.MouseEvent) => {
    // 点到功能按钮时不触发拖拽
    if ((e.target as HTMLElement).closest('button')) return
    isDragging.current = true
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
    e.preventDefault()
  }

  const onResize = (e: React.MouseEvent, dir: string) => {
    e.stopPropagation()
    e.preventDefault()
    isResizing.current = true
    resizeDir.current = dir
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: size.width,
      h: size.height,
      px: position.x,
      py: position.y
    }
  }

  const ringColor =
    statusColor === 'green'
      ? 'border-emerald-300'
      : statusColor === 'red'
        ? 'border-rose-400 animate-pulse'
        : 'border-amber-300'

  const dotColor =
    statusColor === 'green'
      ? 'bg-emerald-500'
      : statusColor === 'red'
        ? 'bg-rose-500 animate-pulse'
        : 'bg-amber-500'

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: isMinimized ? 120 : size.width,
        height: isMinimized ? 64 : size.height,
        zIndex: 999,
        cursor: 'move'
      }}
      className={`bg-white/95 border-2 ${ringColor} rounded-2xl shadow-xl backdrop-blur-md select-none flex flex-col overflow-hidden`}
      onMouseDown={onContainerMouseDown}
    >
      {/* 顶栏：状态点 + 最小化/展开 + 关闭 */}
      <div className="w-full h-7 flex items-center justify-between px-2 shrink-0 bg-white/60">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
          <span className="text-[10px] font-bold text-slate-500 font-mono">
            {statusColor.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setIsMinimized((v) => !v)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {isMinimized ? <Maximize2 size={11} /> : <Minus size={11} />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* 内容区 */}
      {isMinimized ? (
        <div className="flex-1 flex items-center justify-center px-2 pb-1">
          <div className={`w-2 h-2 rounded-full shrink-0 mr-1.5 ${dotColor}`} />
          <span className="text-[11px] font-bold text-slate-600 font-mono">坐姿监测中</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-1.5 p-2 overflow-hidden">
          {/* 视频画面 */}
          <div className="flex-1 rounded-xl overflow-hidden bg-slate-100 min-h-0">
            {imgSrc ? (
              <img src={imgSrc} alt="posture" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 min-h-[80px]">
                <Video size={18} className="text-slate-300" />
                <span className="text-[9px] text-slate-400 font-mono">等待 AI 数据...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 缩放手柄（展开时才显示）*/}
      {!isMinimized && (
        <>
          <div
            onMouseDown={(e) => onResize(e, 'n')}
            className="absolute top-0 left-3 right-3 h-1 cursor-n-resize z-50"
          />
          <div
            onMouseDown={(e) => onResize(e, 's')}
            className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize z-50"
          />
          <div
            onMouseDown={(e) => onResize(e, 'e')}
            className="absolute top-3 bottom-3 right-0 w-1 cursor-e-resize z-50"
          />
          <div
            onMouseDown={(e) => onResize(e, 'w')}
            className="absolute top-3 bottom-3 left-0 w-1 cursor-w-resize z-50"
          />
          <div
            onMouseDown={(e) => onResize(e, 'se')}
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50"
          />
          <div
            onMouseDown={(e) => onResize(e, 'sw')}
            className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-50"
          />
          <div
            onMouseDown={(e) => onResize(e, 'ne')}
            className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-50"
          />
          <div
            onMouseDown={(e) => onResize(e, 'nw')}
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-50"
          />
        </>
      )}
    </div>
  )
}
