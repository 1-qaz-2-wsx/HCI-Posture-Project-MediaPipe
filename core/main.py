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

# ================= 3. 模型路径与自动下载 =================
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "pose_landmarker_full.task")
MODEL_URL  = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"

# 手势模型路径（和坐姿模型放在同一目录）
HAND_MODEL_PATH = os.path.join(SCRIPT_DIR, "hand_landmarker.task")
HAND_MODEL_URL  = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"

def ensure_model(path, url, name):
    if not os.path.exists(path):
        sys.stdout.write(json.dumps({
            "hasUser": False, "statusColor": "orange",
            "statusText": f"首次运行，正在下载 {name}..."
        }) + "\n")
        sys.stdout.flush()
        try:
            urllib.request.urlretrieve(url, path)
        except Exception as e:
            sys.stdout.write(json.dumps({
                "hasUser": False, "statusColor": "red",
                "statusText": f"ERROR: {name} 下载失败: {str(e)}"
            }) + "\n")
            sys.stdout.flush()
            sys.exit(1)

ensure_model(MODEL_PATH,      MODEL_URL,      "姿态检测模型(约9MB)")
ensure_model(HAND_MODEL_PATH, HAND_MODEL_URL, "手势检测模型(约4MB)")

# ================= 4. 初始化 MediaPipe =================
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# 坐姿检测器
pose_detector = vision.PoseLandmarker.create_from_options(
    vision.PoseLandmarkerOptions(
        base_options=python.BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=vision.RunningMode.IMAGE
    )
)

# 手势检测器（复用同一个 Python 进程，无需额外网络请求）
hand_detector = vision.HandLandmarker.create_from_options(
    vision.HandLandmarkerOptions(
        base_options=python.BaseOptions(model_asset_path=HAND_MODEL_PATH),
        running_mode=vision.RunningMode.IMAGE,
        num_hands=2,
        min_hand_detection_confidence=0.7,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
)

# ================= 5. 校准变量 =================
WINDOW_SIZE = 15
angle_history = deque(maxlen=WINDOW_SIZE)
z_history     = deque(maxlen=WINDOW_SIZE)

is_calibrated = False
base_angle    = 0.0
base_z_diff   = 0.0

THRESHOLD_KYPHOSIS_DEVIATION = 8.0
THRESHOLD_FORWARD_DEVIATION  = 0.04

# 当前模式：posture（坐姿） 或 gesture（手势游戏）
current_mode = "posture"

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    sys.stdout.write(json.dumps({
        "hasUser": False, "statusColor": "red",
        "statusText": "ERROR: 无法打开摄像头"
    }) + "\n")
    sys.stdout.flush()
    sys.exit(1)

total_frames   = 0
good_frames    = 0
kyphosis_frames = 0
forward_frames  = 0
score = 100

# ================= 6. 主循环 =================
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

    # 模式切换指令
    if cmd == "gesture":
        current_mode = "gesture"
        cmd = ""
    elif cmd == "posture":
        current_mode = "posture"
        cmd = ""

    # quit 指令
    if cmd in ("q", "quit"):
        break

    img_rgb   = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image  = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)

    # ── 手势游戏模式 ──────────────────────────────────────────
    if current_mode == "gesture":
        result = hand_detector.detect(mp_image)

        hands_data = []
        if result.hand_landmarks:
            for hand_lms in result.hand_landmarks:
                # 绘制骨骼点
                for lm in hand_lms:
                    cx, cy = int(lm.x * w_img), int(lm.y * h_img)
                    cv2.circle(img, (cx, cy), 5, (255, 255, 255), -1)

                # 只把归一化坐标发给前端（x/y 在 0~1 之间）
                # 前端用这些坐标触发烟花，不需要自己跑 MediaPipe
                landmarks = [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in hand_lms]
                hands_data.append(landmarks)

        # 编码画面
        _, buffer  = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 60])
        img_base64 = base64.b64encode(buffer).decode('utf-8')

        # 发送手势数据帧（type 字段让前端区分是哪种数据）
        gesture_frame = {
            "type":  "gesture",
            "hands": hands_data,   # 每只手的 21 个关键点坐标
        }
        sys.stdout.write(json.dumps(gesture_frame) + "\n")
        sys.stdout.write("IMG:" + img_base64 + "\n")
        sys.stdout.flush()

        time.sleep(0.033)  # 约 30fps，游戏模式可以更流畅
        continue           # 跳过坐姿检测逻辑

    # ── 坐姿检测模式（原有逻辑不变）────────────────────────────
    detection_result = pose_detector.detect(mp_image)

    status_text  = "STATUS: SEARCHING USER..."
    status_color = "orange"
    angle_deviation = 0.0
    z_deviation     = 0.0

    if detection_result.pose_landmarks and len(detection_result.pose_landmarks) > 0:
        pose_landmarks = detection_result.pose_landmarks[0]
        total_frames  += 1

        nose           = pose_landmarks[0]
        left_ear       = pose_landmarks[7]
        left_shoulder  = pose_landmarks[11]
        right_shoulder = pose_landmarks[12]

        for landmark in pose_landmarks:
            if landmark.presence > 0.5 and landmark.visibility > 0.5:
                cx, cy = int(landmark.x * w_img), int(landmark.y * h_img)
                cv2.circle(img, (cx, cy), 4, (0, 255, 0), -1)

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
            base_angle    = smooth_angle
            base_z_diff   = smooth_z_diff
            is_calibrated = True

        if not is_calibrated:
            status_text  = "STATUS: PLEASE CALIBRATE"
            status_color = "orange"
        else:
            angle_deviation = smooth_angle  - base_angle
            z_deviation     = smooth_z_diff - base_z_diff

            if angle_deviation > THRESHOLD_KYPHOSIS_DEVIATION:
                status_text   = "STATUS: BAD POSTURE (KYPHOSIS)"
                status_color  = "red"
                kyphosis_frames += 1
                if sys.platform == 'win32':
                    winsound.Beep(700, 50)
            elif z_deviation > THRESHOLD_FORWARD_DEVIATION:
                status_text   = "STATUS: BAD POSTURE (FORWARD HEAD)"
                status_color  = "red"
                forward_frames += 1
                if sys.platform == 'win32':
                    winsound.Beep(1400, 50)
            else:
                status_text  = "STATUS: GOOD POSTURE"
                status_color = "green"
                good_frames += 1

        score = int((good_frames / total_frames) * 100) if total_frames > 0 else 100

        telemetry_data = {
            "type":           "posture",
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
            "type":           "posture",
            "hasUser":        False,
            "isCalibrated":   is_calibrated,
            "statusText":     "STATUS: SEARCHING USER...",
            "statusColor":    "orange",
            "score":          score,
            "angleDeviation": 0,
            "zDeviation":     0,
        }

    _, buffer  = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 50])
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    sys.stdout.write(json.dumps(telemetry_data) + "\n")
    sys.stdout.write("IMG:" + img_base64 + "\n")
    sys.stdout.flush()

    time.sleep(0.04)

cap.release()