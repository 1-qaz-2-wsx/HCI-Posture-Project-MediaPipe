# core/main.py
import cv2
import winsound
import time
import os
import math
import sys
import json
import threading
import queue
from collections import deque
import base64
import urllib.request

# ================= 1. 核心数学函数 =================
def calculate_angle_with_vertical(pt_upper, pt_lower):
    dx = pt_lower.x - pt_upper.x
    dy = pt_lower.y - pt_upper.y
    angle_radians = math.atan2(abs(dx), abs(dy))
    return math.degrees(angle_radians)

# Bug 3 修复：骨骼线函数移到循环外，避免每帧重复定义
def draw_bone_line(img, pose_landmarks, p1_idx, p2_idx, w, h, color=(255, 120, 0), thickness=2):
    if p1_idx < len(pose_landmarks) and p2_idx < len(pose_landmarks):
        lm1 = pose_landmarks[p1_idx]
        lm2 = pose_landmarks[p2_idx]
        cv2.line(img,
                 (int(lm1.x * w), int(lm1.y * h)),
                 (int(lm2.x * w), int(lm2.y * h)),
                 color, thickness)

# ================= 2. 后台线程监听 stdin =================
command_queue = queue.Queue()

def electron_stream_reader():
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            command_queue.put(line.strip())
        except Exception:
            break

threading.Thread(target=electron_stream_reader, daemon=True).start()

# ================= 3. 初始化 & 自动下载 MediaPipe 模型 =================

# 1. 统一计算模型的绝对路径
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "pose_landmarker_full.task")
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"

# 2. 如果本地不存在模型，触发自动下载
if not os.path.exists(MODEL_PATH):
    try:
        # 向前端发送下载中的状态，让 Electron 界面显示加载动画
        sys.stdout.write(json.dumps({
            "hasUser": False, 
            "statusColor": "orange",
            "statusText": "首次运行，正在后台下载 MediaPipe 姿态检测模型(约9MB)..."
        }) + "\n")
        sys.stdout.flush()
        
        # 执行下载
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        
    except Exception as e:
        # 如果断网或下载失败，安全退出并通知前端
        sys.stdout.write(json.dumps({
            "hasUser": False, 
            "statusColor": "red",
            "statusText": f"ERROR: 模型下载失败，请检查网络连接: {str(e)}"
        }) + "\n")
        sys.stdout.flush()
        sys.exit(1)

# 3. 兜底验证：确保模型文件最终确实存在
if not os.path.exists(MODEL_PATH):
    sys.stdout.write(json.dumps({
        "hasUser": False, 
        "statusColor": "red",
        "statusText": "ERROR: 未找到模型文件 pose_landmarker_full.task"
    }) + "\n")
    sys.stdout.flush()
    sys.exit(1)

# # 定义模型存放路径和官方安全下载链接
# MODEL_NAME = os.path.join(os.path.dirname(__file__), "pose_landmarker_full.task")
# MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"

# def init_mediapipe():
#     if not os.path.exists(MODEL_NAME):
#         print("首次运行，正在从 Google 官方下载 MediaPipe 姿态检测模型，请稍候...")
#         # 自动下载并保存到 core/ 目录下
#         urllib.request.urlretrieve(MODEL_URL, MODEL_NAME)
#         print("模型下载成功！")

# # ================= 3. 初始化 MediaPipe =================
# MODEL_NAME = "pose_landmarker_full.task"
# if not os.path.exists(MODEL_NAME):
#     script_dir = os.path.dirname(os.path.abspath(__file__))
#     MODEL_NAME = os.path.join(script_dir, MODEL_NAME)
#     if not os.path.exists(MODEL_NAME):
#         sys.stdout.write(json.dumps({
#             "hasUser": False, "statusColor": "red",
#             "statusText": "ERROR: 未找到模型文件 pose_landmarker_full.task"
#         }) + "\n")
#         sys.stdout.flush()
#         sys.exit(1)

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

base_options = python.BaseOptions(model_asset_path=MODEL_NAME)
options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.IMAGE
)
detector = vision.PoseLandmarker.create_from_options(options)

# ================= 4. 校准变量 =================
WINDOW_SIZE = 15 # 增加平滑窗口大小，减少抖动
angle_history = deque(maxlen=WINDOW_SIZE)
z_history = deque(maxlen=WINDOW_SIZE)

is_calibrated = False
base_angle = 0.0
base_z_diff = 0.0

THRESHOLD_KYPHOSIS_DEVIATION = 8.0
THRESHOLD_FORWARD_DEVIATION = 0.04

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    sys.stdout.write(json.dumps({
        "hasUser": False, "statusColor": "red",
        "statusText": "ERROR: 无法打开摄像头"
    }) + "\n")
    sys.stdout.flush()
    sys.exit(1)

total_frames = 0
good_frames = 0
kyphosis_frames = 0
forward_frames = 0
score = 100

while True:
    success, img = cap.read()
    if not success:
        break

    img = cv2.flip(img, 1)
    h_img, w_img, _ = img.shape

    cmd = ""
    try:
        cmd = command_queue.get_nowait()
    except queue.Empty:
        pass

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

        nose          = pose_landmarks[0]
        left_ear      = pose_landmarks[7]
        left_shoulder = pose_landmarks[11]
        right_shoulder = pose_landmarks[12]

        # 绘制关键点
        for landmark in pose_landmarks:
            if landmark.presence > 0.5 and landmark.visibility > 0.5:
                cx, cy = int(landmark.x * w_img), int(landmark.y * h_img)
                cv2.circle(img, (cx, cy), 4, (0, 255, 0), -1)

        # 绘制骨骼线（函数已移到循环外）
        draw_bone_line(img, pose_landmarks, 11, 12, w_img, h_img, (255, 100, 0), 3)
        draw_bone_line(img, pose_landmarks,  7, 11, w_img, h_img, (0, 255, 255), 2)

        shoulder_center_z = (left_shoulder.z + right_shoulder.z) / 2
        raw_angle  = calculate_angle_with_vertical(left_ear, left_shoulder)
        raw_z_diff = shoulder_center_z - nose.z

        angle_history.append(raw_angle)
        z_history.append(raw_z_diff)
        smooth_angle  = sum(angle_history) / len(angle_history)
        smooth_z_diff = sum(z_history) / len(z_history)

        if cmd in ("c", "calibrate"):
            base_angle   = smooth_angle
            base_z_diff  = smooth_z_diff
            is_calibrated = True

        if not is_calibrated:
            status_text  = "STATUS: PLEASE CALIBRATE"
            status_color = "orange"
        else:
            angle_deviation = smooth_angle  - base_angle
            z_deviation     = smooth_z_diff - base_z_diff

            if angle_deviation > THRESHOLD_KYPHOSIS_DEVIATION:
                status_text  = "STATUS: BAD POSTURE (KYPHOSIS)"
                status_color = "red"
                kyphosis_frames += 1
                if sys.platform == 'win32':
                    winsound.Beep(700, 50)
            elif z_deviation > THRESHOLD_FORWARD_DEVIATION:
                status_text  = "STATUS: BAD POSTURE (FORWARD HEAD)"
                status_color = "red"
                forward_frames += 1
                if sys.platform == 'win32':
                    winsound.Beep(1400, 50)
            else:
                status_text  = "STATUS: GOOD POSTURE"
                status_color = "green"
                good_frames += 1

        score = int((good_frames / total_frames) * 100) if total_frames > 0 else 100

        telemetry_data = {
            "hasUser":        True,
            "isCalibrated":   is_calibrated,
            "statusText":     status_text,
            "statusColor":    status_color,
            "score":          score,
            "angleDeviation": round(angle_deviation, 1),
            "zDeviation":     round(z_deviation, 3),
        }
    else:
        telemetry_data = {
            "hasUser":        False,
            "isCalibrated":   is_calibrated,
            "statusText":     "STATUS: SEARCHING USER...",
            "statusColor":    "orange",
            "score":          score,
            "angleDeviation": 0,
            "zDeviation":     0,
        }

    # Bug 1 修复：数据 JSON 和图片 base64 分两行发送，彻底避免超长行被切断
    _, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 50])
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    sys.stdout.write(json.dumps(telemetry_data) + "\n")
    sys.stdout.write("IMG:" + img_base64 + "\n")   # 固定前缀 IMG: 让 Node.js 识别
    sys.stdout.flush()

    if cmd in ("q", "quit"):
        break

    time.sleep(0.04)

cap.release()