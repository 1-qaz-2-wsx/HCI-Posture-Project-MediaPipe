// src/renderer/src/pages/games/GestureFireworks.tsx
import React, { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'

export default function GestureFireworks() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastFire = useRef(0)
  const [tip, setTip] = useState('正在加载 MediaPipe Hands...')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let camera: any

    async function init() {
      try {
        // 1. 直接使用 ESM 动态导入，无需担心 window 全局变量挂载时机
        const mpHands =
          await import('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js')
        const mpCamera =
          await import('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1640029074/camera_utils.js')
        const mpDrawing =
          await import('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1620248257/drawing_utils.js')

        // 2. 从模块中提取核心类和方法（ESM 模块导出的类就在 .Hands / .Camera 下）
        const HandsConstructor = mpHands.Hands
        const CameraConstructor = mpCamera.Camera
        const { drawConnectors, drawLandmarks, HAND_CONNECTIONS } = mpDrawing

        if (!HandsConstructor || !CameraConstructor) {
          throw new Error('未能在 CDN 模块中找到对应的构造函数')
        }

        // 3. 实例化 Hands
        const hands = new HandsConstructor({
          locateFile: (f: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`
        })

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5
        })

        hands.onResults((results: any) => {
          const canvas = canvasRef.current
          const video = videoRef.current
          if (!canvas || !video) return
          const ctx = canvas.getContext('2d')!
          canvas.width = video.videoWidth || 640
          canvas.height = video.videoHeight || 480

          // 镜像绘制视频帧
          ctx.save()
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.scale(-1, 1)
          ctx.translate(-canvas.width, 0)
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)
          ctx.restore()

          if (results.multiHandLandmarks) {
            for (const lm of results.multiHandLandmarks) {
              drawConnectors(ctx, lm, HAND_CONNECTIONS, {
                color: 'rgba(255,255,255,0.35)',
                lineWidth: 1
              })
              drawLandmarks(ctx, lm, { color: '#fff', lineWidth: 1, radius: 4 })

              // 食指尖 (index 8) 触发烟花，每 400ms 最多一次
              const tip8 = lm[8]
              const now = Date.now()
              if (now - lastFire.current > 400) {
                lastFire.current = now
                confetti({
                  particleCount: 70,
                  spread: 90,
                  origin: { x: 1 - tip8.x, y: tip8.y },
                  colors: ['#FF6B9D', '#A78BFA', '#60A5FA', '#34D399', '#FBBF24']
                })
              }
            }
          }
        })

        // 4. 实例化 Camera
        camera = new CameraConstructor(videoRef.current!, {
          onFrame: async () => {
            await hands.send({ image: videoRef.current! })
          },
          width: 640,
          height: 480
        })

        await camera.start()
        setReady(true)
        setTip('将手放入画面，食指尖触发烟花 🎆')
      } catch (e) {
        console.error('MediaPipe 初始化错误:', e)
        setError(true)
        setTip('加载失败，请检查网络连接后刷新重试')
      }
    }

    init()
    return () => {
      try {
        camera?.stop()
      } catch (_) {}
    }
  }, [])

  return (
    <div className="flex-1 flex flex-col gap-3">
      <p
        className={`text-sm font-medium text-center ${
          error ? 'text-rose-500' : ready ? 'text-emerald-600' : 'text-slate-400'
        }`}
      >
        {tip}
      </p>

      <div
        className="flex-1 relative rounded-3xl overflow-hidden bg-slate-900"
        style={{ minHeight: 360 }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white/50 text-xs">首次加载约需 10 秒，请稍候</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/50 text-sm">❌ 加载失败，请检查网络</p>
          </div>
        )}
      </div>
    </div>
  )
}
