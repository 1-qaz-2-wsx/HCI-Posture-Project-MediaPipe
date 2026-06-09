# core/main.py
import cv2
import numpy as np
import winsound
import time
import os
import math
import sys
import json
import select
from collections import deque

# ================= 1. 核心数学函数 =================
def calculate_angle_with_vertical(pt_upper, pt_lower):
    dx = pt_lower.x - pt_upper.x
    dy = pt_lower.y - pt_upper.y
    angle_radians = math.atan2(abs(dx), abs(dy))
    return math.degrees(angle_radians)

# ================= 2. 初始化 MediaPipe 骨骼引擎 =================
MODEL_NAME = "pose_landmarker_full.task"
if not os.path.exists(MODEL_NAME):
    # 尝试在脚本所在目录寻找
    script_dir = os.path.dirname(os.path.abspath(__file__))
    MODEL_NAME = os.path.join(script_dir, MODEL_NAME)
    if not os.path.exists(MODEL_NAME):
        sys.stdout.write(json.dumps({"hasUser": False, "statusText": "ERROR: 未找到核心模型文件 pose_landmarker_full.task"}) + "\n")
        sys.stdout.flush()
        sys.exit(1)

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

base_options = python.BaseOptions(model_asset_path=MODEL_NAME)
options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.IMAGE
)
detector = vision.PoseLandmarker.create_from_options(options)

# ================= 3. 时序滤波器与动态校准变量 =================
WINDOW_SIZE = 8
angle_history = deque(maxlen=WINDOW_SIZE)
z_history = deque(maxlen=WINDOW_SIZE)

is_calibrated = False
base_angle = 0.0
base_z_diff = 0.0

THRESHOLD_KYPHOSIS_DEVIATION = 8.0   # 驼背阈值
THRESHOLD_FORWARD_DEVIATION = 0.04   # 探头阈值

cap = cv2.VideoCapture(0)
start_time = time.time()
total_frames = 0
good_frames = 0
kyphosis_frames = 0
forward_frames = 0
score = 100

# 让标准输入流变成非阻塞模式，用来接收前端发来的校准信号
if sys.platform != 'win32':
    import fcntl
    fl = fcntl.fcntl(sys.stdin, fcntl.F_GETFL)
    fcntl.fcntl(sys.stdin, fcntl.F_SETFL, fl | os.O_NONBLOCK)

while True:
    success, img = cap.read()
    if not success: 
        break
    
    img = cv2.flip(img, 1) 
    h_img, w_img, _ = img.shape
    
    # 检查前端有没有发指令过来（比如用户在前端点击了“录入标准坐姿”按钮）
    cmd = ""
    if sys.platform == 'win32':
        import msvcrt
        if msvcrt.kbhit():
            cmd = sys.stdin.readline().strip()
    else:
        r, _, _ = select.select([sys.stdin], [], [], 0)
        if r:
            cmd = sys.stdin.readline().strip()

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
    detection_result = detector.detect(mp_image)
    
    status_text = "STATUS: SEARCHING USER..."
    status_color = "orange"
    angle_deviation = 0.0
    z_deviation = 0.0

    if detection_result.pose_landmarks and len(detection_result.pose_landmarks) > 0:
        pose_landmarks = detection_result.pose_landmarks[0]
        total_frames += 1
        
        # 提取核心解剖学计算点
        nose = pose_landmarks[0]
        left_ear = pose_landmarks[7]
        left_shoulder = pose_landmarks[11]
        right_shoulder = pose_landmarks[12]
        
        shoulder_center_z = (left_shoulder.z + right_shoulder.z) / 2
        raw_angle = calculate_angle_with_vertical(left_ear, left_shoulder) 
        raw_z_diff = shoulder_center_z - nose.z 
        
        # 时序窗口平滑
        angle_history.append(raw_angle)
        z_history.append(raw_z_diff)
        smooth_angle = sum(angle_history) / len(angle_history)
        smooth_z_diff = sum(z_history) / len(z_history)
        
        # 监听外部发来的校准命令
        if cmd == "c" or cmd == "calibrate":
            base_angle = smooth_angle
            base_z_diff = smooth_z_diff
            is_calibrated = True

        if not is_calibrated:
            status_text = "STATUS: PLEASE CALIBRATE"
            status_color = "orange"
        else:
            angle_deviation = smooth_angle - base_angle
            z_deviation = smooth_z_diff - base_z_diff
            
            if angle_deviation > THRESHOLD_KYPHOSIS_DEVIATION:
                status_text = "STATUS: BAD POSTURE (KYPHOSIS)"
                status_color = "red"
                kyphosis_frames += 1
                winsound.Beep(700, 50) if sys.platform == 'win32' else None
            elif z_deviation > THRESHOLD_FORWARD_DEVIATION:
                status_text = "STATUS: BAD POSTURE (FORWARD HEAD)"
                status_color = "red"
                forward_frames += 1
                winsound.Beep(1400, 50) if sys.platform == 'win32' else None
            else:
                status_text = "STATUS: GOOD POSTURE"
                status_color = "green"
                good_frames += 1
                
        score = int((good_frames / total_frames) * 100) if total_frames > 0 else 100

        telemetry_data = {
            "hasUser": True,
            "isCalibrated": is_calibrated,
            "statusText": status_text,
            "statusColor": status_color,
            "score": score,
            "angleDeviation": round(angle_deviation, 1),
            "zDeviation": round(z_deviation, 3)
        }
    else:
        telemetry_data = {
            "hasUser": False,
            "isCalibrated": is_calibrated,
            "statusText": "STATUS: SEARCHING USER...",
            "statusColor": "orange",
            "score": score,
            "angleDeviation": 0,
            "zDeviation": 0
        }

    #发射回前端
    sys.stdout.write(json.dumps(telemetry_data) + "\n")
    sys.stdout.flush()
    
    if cmd == "q" or cmd == "quit":
        break
        
    time.sleep(0.04) # 限制 25 帧左右，防止前端数据通道挤压

cap.release()