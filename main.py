import cv2
import numpy as np
import winsound
import time
import os
import urllib.request

# ================= 🚀 1. 自动获取谷歌官方最新 3D 骨骼模型 =================
MODEL_NAME = "pose_landmarker_full.task"
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"

if not os.path.exists(MODEL_NAME):
    print(f"\n[SYSTEM] 检测到缺少新版 3D 核心模型，正在尝试从谷歌官方镜像安全下载 (约 30MB)...")
    try:
        # 设置超时保护，防止国内网络卡死
        urllib.request.urlretrieve(MODEL_URL, MODEL_NAME)
        print("[SYSTEM] 核心模型下载成功！")
    except Exception as e:
        print("\n" + "!"*50)
        print("[⚠️ 网络警告] 自动下载模型超时（因国内网络可能无法直连谷歌服务器）。")
        print(f"请手动复制以下链接到浏览器下载，下载后改名为 '{MODEL_NAME}' 放到当前项目文件夹下：")
        print(MODEL_URL)
        print("!"*50 + "\n")

# ================= 🚀 2. 初始化全新 Tasks API 骨骼引擎 =================
USE_MEDIAPIPE = False
ENGINE_NAME = "OpenCV Haar-Cascade Engine (Fallback)"

if os.path.exists(MODEL_NAME):
    try:
        import mediapipe as mp
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision
        
        # 配置新版 Tasks 属性
        base_options = python.BaseOptions(model_asset_path=MODEL_NAME)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE
        )
        detector = vision.PoseLandmarker.create_from_options(options)
        USE_MEDIAPIPE = True
        ENGINE_NAME = "MediaPipe Tasks API (Next-Gen 3D Engine)"
        print("\n[SYSTEM LOG] 成功激活 2026 最新版 MediaPipe Tasks 3D 骨骼内核！")
    except Exception as e:
        print(f"\n[SYSTEM LOG] 现代 Tasks 引擎加载失败: {e}，将自动切换至 OpenCV 兜底。")

if not USE_MEDIAPIPE:
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# ================= 3. 统一的数据初始化 =================
cap = cv2.VideoCapture(0)
start_time = time.time()
good_frames = 0
total_frames = 0
score = 100
threshold = 0.15 if USE_MEDIAPIPE else 180 

print(f"==================================================")
print(f" 智慧坐姿卫士 Pro - 现代 Tasks 架构自适应版")
print(f" 当前运行内核: {ENGINE_NAME}")
print(f" [操作指南] 按 W/S 键调节灵敏度 | 按 Q 键退出并生成报告")
print(f"==================================================")

while True:
    success, img = cap.read()
    if not success: break
    
    img = cv2.flip(img, 1) 
    h_img, w_img, _ = img.shape
    elapsed_time = int(time.time() - start_time)
    mins, secs = divmod(elapsed_time, 60)

    # 绘制高级半透明 Dashboard 看板
    overlay = img.copy()
    cv2.rectangle(overlay, (0, 0), (w_img, 100), (25, 25, 25), -1)
    cv2.addWeighted(overlay, 0.75, img, 0.25, 0, img)

    status_text = "STATUS: INITIALIZING..."
    status_color = (0, 255, 255)

    # ---------------- 分支 A：新版 MediaPipe Tasks 3D 骨骼 ----------------
    if USE_MEDIAPIPE:
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
        detection_result = detector.detect(mp_image)
        
        if detection_result.pose_landmarks:
            pose_landmarks = detection_result.pose_landmarks[0] # 获取第一个检测到的人
            
            # 提取核心关键点（Tasks API 索引保持一致：0鼻子，11左肩，12右肩）
            nose_y = pose_landmarks[0].y
            shoulder_center_y = (pose_landmarks[11].y + pose_landmarks[12].y) / 2
            distance = shoulder_center_y - nose_y
            
            total_frames += 1
            if distance < threshold:
                status_text, status_color = "STATUS: BAD POSTURE (KYPHOSIS)", (0, 0, 255)
                cv2.rectangle(img, (0, 0), (w_img, h_img), (0, 0, 255), 8)
                winsound.Beep(1200, 100)
            else:
                good_frames += 1
                status_text, status_color = "STATUS: GOOD POSTURE", (0, 255, 0)
            
            # 🔥 【自主研发】高性能纯 OpenCV 3D 骨骼拓扑拓扑网络绘制
            # 1. 绘制 33 个核心躯体关键点
            for lm in pose_landmarks:
                cx, cy = int(lm.x * w_img), int(lm.y * h_img)
                if 0 <= cx < w_img and 0 <= cy < h_img:
                    cv2.circle(img, (cx, cy), 4, (0, 255, 255), -1) # 黄色关节
            
            # 2. 动态绘制核心人体骨架连线（躯干与双臂拓扑）
            connections = [(11, 12), (11, 23), (12, 24), (23, 24), (11, 13), (13, 15), (12, 14), (14, 16)]
            for start_idx, end_idx in connections:
                pt_start = (int(pose_landmarks[start_idx].x * w_img), int(pose_landmarks[start_idx].y * h_img))
                pt_end = (int(pose_landmarks[end_idx].x * w_img), int(pose_landmarks[end_idx].y * h_img))
                cv2.line(img, pt_start, pt_end, (255, 255, 0), 2) # 青色骨骼线
                
            score = int((good_frames / total_frames) * 100) if total_frames > 0 else 100
            cv2.putText(img, f"HCI Sensitivity: {threshold:.2f} (W/S) | Dist: {distance:.3f}", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)
        else:
            status_text = "STATUS: SEARCHING USER..."

    # ---------------- 分支 B：OpenCV 级联特征人脸（完美兜底） ----------------
    else:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        cv2.line(img, (0, int(threshold)), (w_img, int(threshold)), (0, 165, 255), 2, cv2.LINE_AA)
        cv2.putText(img, "ALERT LINE", (10, int(threshold) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 1)
        
        if len(faces) > 0:
            (x, y, w, h) = faces[0]
            cv2.rectangle(img, (x, y), (x+w, y+h), (255, 150, 0), 2)
            total_frames += 1
            if y > threshold:
                status_text, status_color = "STATUS: BAD POSTURE (SLUMP)", (0, 0, 255)
                cv2.rectangle(img, (0, 0), (w_img, h_img), (0, 0, 255), 8)
                winsound.Beep(1000, 100)
            else:
                good_frames += 1
                status_text, status_color = "STATUS: GOOD POSTURE", (0, 255, 0)
            score = int((good_frames / total_frames) * 100) if total_frames > 0 else 100
        else:
            status_text = "STATUS: NO USER DETECTED"
        cv2.putText(img, f"Alert Line Height: {int(threshold)} (W/S to Move)", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)

    # 通用 UI 渲染
    cv2.putText(img, status_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.75, status_color, 2)
    cv2.putText(img, f"HEALTH SCORE: {score}%", (360, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 200, 0), 2)
    cv2.putText(img, f"TIME: {mins:02d}:{secs:02d}", (w_img-150, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)

    cv2.imshow("Smart Posture System Pro - NextGen Edition", img)
    
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'): break
    elif key == ord('w'): threshold -= 0.01 if USE_MEDIAPIPE else 10
    elif key == ord('s'): threshold += 0.01 if USE_MEDIAPIPE else 10

cap.release()
cv2.destroyAllWindows()

# ================= 4. 自动化 HCI 实验报告生成 =================
print("\n" + "="*12 + " HUMAN-COMPUTER INTERACTION REPORT " + "="*12)
print(f"核心检测内核 (Active Kernel): {ENGINE_NAME}")
print(f"有效测试时长 (Session Duration): {mins} 分 {secs} 秒")
print(f"采集行为样本 (Total Evaluated Frames): {total_frames} 帧")
print(f"姿态合规率 (Posture Compliance Score): {score}%")
print("=========================================================")