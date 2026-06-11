// src/renderer/src/components/PostureFloatDeck.tsx
import React, { useState, useEffect, useRef } from 'react'
import { GripHorizontal, Minus, Video, Compass } from 'lucide-react'

interface PostureFloatDeckProps {
  timeLeftStr: string
  taskText: string
  timerMode: 'work' | 'break' | 'idle'
}

export default function PostureFloatDeck({
  timeLeftStr,
  taskText,
  timerMode
}: PostureFloatDeckProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [statusColor, setStatusColor] = useState<'green' | 'orange' | 'red'>('orange')

  // 基础状态：位置与大小
  const [position, setPosition] = useState({ x: 740, y: 80 })
  const [size, setSize] = useState({ width: 230, height: 190 })
  const [isMinimized, setIsMinimized] = useState(false)

  // 原生操控辅助 Ref
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  const dragStart = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 })
  const resizeDir = useRef<string>('')

  // 接收数据通道
  useEffect(() => {
    const api = (window as any).api
    if (!api?.onPostureData) return
    api.onPostureData((t: any) => {
      if (t.image) setImgSrc(t.image)
      if (t.statusColor) setStatusColor(t.statusColor)
    })
  }, [])

  // 唤醒重置
  useEffect(() => {
    const handleSummon = () => {
      setIsMinimized(false)
      setPosition({ x: 500, y: 150 })
      setSize({ width: 230, height: 190 })
    }
    window.addEventListener('summon-posture-deck', handleSummon)
    return () => window.removeEventListener('summon-posture-deck', handleSummon)
  }, [])

  // 1️⃣ 原生最直观的拖拽触发 (收起后不能移动)
  const handleDragMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return // 收起后封锁移动
    setIsDragging(true)
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
    e.preventDefault()
  }

  // 3️⃣ 八向区域大小收放自如触发
  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    if (isMinimized) return
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    resizeDir.current = direction
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      left: position.x,
      top: position.y
    }
  }

  // 全局鼠标移动与抬起监听 (原生计算，彻底告别诡异动画)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // 丝滑跟手移动，没有任何缓冲和惯性
        const nextX = Math.max(
          0,
          Math.min(e.clientX - dragStart.current.x, window.innerWidth - size.width)
        )
        const nextY = Math.max(
          0,
          Math.min(e.clientY - dragStart.current.y, window.innerHeight - size.height)
        )
        setPosition({ x: nextX, y: nextY })
      } else if (isResizing) {
        const dir = resizeDir.current
        const deltaX = e.clientX - resizeStart.current.x
        const deltaY = e.clientY - resizeStart.current.y

        let newWidth = resizeStart.current.width
        let newHeight = resizeStart.current.height
        let newLeft = resizeStart.current.left
        let newTop = resizeStart.current.top

        // 水平拉伸计算
        if (dir.includes('e')) {
          newWidth = resizeStart.current.width + deltaX
        } else if (dir.includes('w')) {
          newWidth = resizeStart.current.width - deltaX
          if (newWidth >= 180 && newWidth <= 450) {
            newLeft = resizeStart.current.left + deltaX
          }
        }

        // 垂直拉伸计算
        if (dir.includes('s')) {
          newHeight = resizeStart.current.height + deltaY
        } else if (dir.includes('n')) {
          newHeight = resizeStart.current.height - deltaY
          if (newHeight >= 140 && newHeight <= 380) {
            newTop = resizeStart.current.top + deltaY
          }
        }

        // 约束边界
        newWidth = Math.max(180, Math.min(newWidth, 450))
        newHeight = Math.max(140, Math.min(newHeight, 380))

        setSize({ width: newWidth, height: newHeight })
        setPosition({ x: newLeft, y: newTop })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, size, position])

  const ringColor =
    statusColor === 'green'
      ? 'border-emerald-300 shadow-emerald-100/50'
      : statusColor === 'red'
        ? 'border-rose-400 shadow-rose-100/60 animate-pulse'
        : 'border-amber-300 shadow-amber-100/50'

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isMinimized ? '106px' : `${size.width}px`,
        height: isMinimized ? '116px' : `${size.height}px`,
        position: 'absolute'
      }}
      className={`bg-white/95 border-2 ${ringColor} rounded-3xl shadow-xl p-2 z-[999] backdrop-blur-md select-none flex flex-col group overflow-hidden`}
    >
      {/* 5️⃣ 顶部控制中轴：小把手往上提，与减号水平高度严密齐平 */}
      <div className="w-full h-6 flex items-center justify-between shrink-0 px-1 relative mb-1">
        {!isMinimized ? (
          <>
            {/* 居中拖拽把手 */}
            <div
              onMouseDown={handleDragMouseDown}
              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-400 cursor-move py-1 px-3 rounded-md hover:bg-slate-50 transition-colors"
            >
              <GripHorizontal size={14} />
            </div>

            {/* 右侧垂直居中的减号 */}
            <button
              onClick={() => setIsMinimized(true)}
              className="ml-auto text-slate-400 hover:text-slate-600 cursor-pointer transition-colors p-0.5 rounded-md hover:bg-slate-100"
            >
              <Minus size={13} strokeWidth={3} />
            </button>
          </>
        ) : null}
      </div>

      {/* 收起状态的界面表现：彻底封锁移动 */}
      {isMinimized && (
        <div
          onClick={() => setIsMinimized(false)}
          className="flex-1 w-full flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50 rounded-2xl p-1"
        >
          <div
            className={`p-2 rounded-full ${statusColor === 'green' ? 'bg-emerald-500' : 'bg-amber-500'} text-white shadow-xs`}
          >
            <Video size={13} />
          </div>
          <div className="text-[11px] font-black text-slate-700 font-mono tracking-wider">
            {timeLeftStr}
          </div>
        </div>
      )}

      {/* 展开状态的大画面及联动数据 */}
      {!isMinimized && (
        <div className="flex-1 w-full flex flex-col gap-2 overflow-hidden pointer-events-auto">
          {/* 视频核心框 */}
          <div className="relative aspect-video flex-1 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt="Stream"
                // 4️⃣ 纯天然镜头：不做任何 scale 镜像翻转，顺向画面呈现
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-[9px] text-slate-400 flex flex-col items-center gap-1">
                <Video
                  size={16}
                  className={timerMode === 'break' ? 'text-emerald-500' : 'text-blue-500'}
                />
                <span>正在捕获健康姿态...</span>
              </div>
            )}
            <div
              className={`absolute top-1.5 left-1.5 px-1 py-0.5 rounded text-[8px] text-white font-mono font-bold ${
                statusColor === 'green'
                  ? 'bg-emerald-500'
                  : statusColor === 'red'
                    ? 'bg-rose-500 animate-pulse'
                    : 'bg-amber-500'
              }`}
            >
              {statusColor.toUpperCase()}
            </div>
          </div>

          {/* 底部联动卡片 */}
          <div className="flex justify-between items-center bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl gap-2 shrink-0">
            <div className="flex-1 min-w-0 text-left">
              <div
                className={`text-[14px] font-black font-mono tracking-wider text-center ${timerMode === 'break' ? 'text-emerald-600' : 'text-blue-600'}`}
              >
                {timeLeftStr}
              </div>
              <div className="text-[8px] text-slate-400 truncate text-center mt-0.5">
                🎯 {taskText}
              </div>
            </div>
            <div
              className={`p-1.5 rounded-lg bg-white border border-slate-100 shadow-3xs ${timerMode === 'break' ? 'text-emerald-600' : 'text-blue-600'}`}
            >
              <Compass size={12} />
            </div>
          </div>
        </div>
      )}

      {/* 3️⃣ 极其灵敏的四边、四角（八向）全范围隐形拉伸边缘带 */}
      {!isMinimized && (
        <>
          {/* 四个侧边拉伸带 */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
            className="absolute top-0 left-3 right-3 h-1 cursor-n-resize z-50"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize z-50"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            className="absolute top-3 bottom-3 right-0 w-1 cursor-e-resize z-50"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            className="absolute top-3 bottom-3 left-0 w-1 cursor-w-resize z-50"
          />

          {/* 四个拐角拉伸点 */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-50"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-50"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-50"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50"
          />
        </>
      )}
    </div>
  )
}
