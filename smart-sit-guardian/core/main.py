import cv2
import numpy as np
import winsound
import time
import os
import math
import sys
import json
from collections import deque  # 引入队列用于时序平滑

# ================= 🚀 1. 核心数学函数 =================
def calculate_angle_with_vertical(pt_upper, pt_lower):
    """计算耳肩连线与垂直线的夹角"""
    dx = pt_lower.x - pt_upper.x
    dy = pt_lower.y - pt_upper.y
    angle_radians = math.atan2(abs(dx), abs(dy))
    return math.degrees(angle_radians)

# ================= 🚀 2. 初始化 Tasks API 骨骼引擎 =================
MODEL_NAME = "pose_landmarker_full.task"
if not os.path.exists(MODEL_NAME):
    raise FileNotFoundError(f"未找到核心模型文件 '{MODEL_NAME}'，请确保它在当前文件夹下！")

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
# 因为摄像头的画面会有光线抖动，AI 算出来的坐标每一帧都在微微颤抖。
# 为了防止误报，搞一个滑动窗口（时序平滑），
# 每次算角度不只看当前这一帧，而是把最近 8 帧的数据加起来除以 8（算平均值）。
# 高频的抖动噪声被抹平。
WINDOW_SIZE = 8  # 平滑窗口大小（帧数）
angle_history = deque(maxlen=WINDOW_SIZE)
z_history = deque(maxlen=WINDOW_SIZE)

# 校准基准值（初始未校准）
is_calibrated = False
base_angle = 0.0
base_z_diff = 0.0

# 相对触发阈值（从基准坐姿偏离多少判定为异常）
THRESHOLD_KYPHOSIS_DEVIATION = 8.0  # 耳肩夹角偏离标准坐姿 8 度以上判定为驼背
# 优化正面深度：结合2D距离压缩与Z轴深度变化
# 利用 MediaPipe 独特的 Z 轴（深度轴）。
# MediaPipe 规定，越靠近摄像头，Z 值越小（负得越多）。
# 脖子往前探时，鼻尖拼命靠近摄像头（Z 值暴跌），而肩膀靠在椅背上没动。
# 代码用 肩膀Z - 鼻子Z，一旦探头，这个深度差值就会剧烈增大
THRESHOLD_FORWARD_DEVIATION = 0.04   # 深度偏离 0.04 以上判定为探头


cap = cv2.VideoCapture(0)
start_time = time.time()
total_frames = 0
good_frames = 0
kyphosis_frames = 0
forward_frames = 0

print("==================================================")
print(" 智慧坐姿卫士 Pro - 算法自适应校准平滑版")
print(" [核心机制] 时序均值滤波 + 动态原点校准算法")
print(" [重要操作] 请在摄像头前端正坐好，按 'C' 键录入标准坐姿！")
print("==================================================")

while True:
    success, img = cap.read()
    if not success: break
    
    img = cv2.flip(img, 1) 
    h_img, w_img, _ = img.shape
    elapsed_time = int(time.time() - start_time)
    mins, secs = divmod(elapsed_time, 60)

    # 渲染 Dashboard 看板
    overlay = img.copy()
    cv2.rectangle(overlay, (0, 0), (w_img, 120), (20, 20, 20), -1)
    cv2.addWeighted(overlay, 0.8, img, 0.2, 0, img)

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
    detection_result = detector.detect(mp_image)
    
    status_text = "STATUS: SEARCHING USER..."
    status_color = (0, 255, 255)
    

    if detection_result.pose_landmarks:

        # 组装我们要丢给前端的“高价值 HCI 数据包”
        telemetry_data = {
            "hasUser": True,
            "isCalibrated": is_calibrated,
            "statusText": status_text,
            "statusColor": "green" if status_color == (0, 255, 0) else "orange" if status_color == (20, 20, 20) else "red",
            "score": score,
            "angleDeviation": round(angle_deviation, 1) if is_calibrated else 0,
            "zDeviation": round(z_deviation, 3) if is_calibrated else 0
        }
    else:
        telemetry_data = { "hasUser": False, "score": 100 }


    #     pose_landmarks = detection_result.pose_landmarks[0]
    #     total_frames += 1
        
    #     # 提取核心计算点
    #     nose = pose_landmarks[0]
    #     left_ear = pose_landmarks[7]
    #     right_ear = pose_landmarks[8]
    #     left_shoulder = pose_landmarks[11]
    #     right_shoulder = pose_landmarks[12]
        
    #     # 实时计算原始解剖学特征
    #     shoulder_center_z = (left_shoulder.z + right_shoulder.z) / 2
    #     raw_angle = calculate_angle_with_vertical(left_ear, left_shoulder) # 耳肩夹角 
    #     raw_z_diff = shoulder_center_z - nose.z # 深度变化 
        
    #     #【机制一】时序窗口动态平滑（抹平单帧噪声抖动）
    #     angle_history.append(raw_angle)
    #     z_history.append(raw_z_diff)
    #     smooth_angle = sum(angle_history) / len(angle_history)
    #     smooth_z_diff = sum(z_history) / len(z_history)
        
    #     # ================= 核心状态机行为分级 =================
    #     if not is_calibrated:
    #         status_text = "STATUS: PLEASE PRESS 'C' TO CALIBRATE YOUR POSTURE"
    #         status_color = (255, 150, 0)
    #     else:
    #         # 计算当前状态相对于用户“黄金原点”的偏差
    #         angle_deviation = smooth_angle - base_angle
    #         z_deviation = smooth_z_diff - base_z_diff
            
    #         # 【精准策略】当人驼背向后瘫时，正面视觉表现为耳肩线向后下方倾斜，角度偏离变大
    #         if angle_deviation > THRESHOLD_KYPHOSIS_DEVIATION:
    #             status_text = "STATUS: BAD POSTURE (KYPHOSIS / SLUMPED)"
    #             status_color = (0, 69, 255) # 橙色驼背
    #             kyphosis_frames += 1
    #             cv2.rectangle(img, (0, 0), (w_img, h_img), (0, 69, 255), 8)
    #             winsound.Beep(700, 80)
                
    #         elif z_deviation > THRESHOLD_FORWARD_DEVIATION:
    #             status_text = "STATUS: BAD POSTURE (FORWARD HEAD / TEXT NECK)"
    #             status_color = (0, 0, 255) # 红色探头
    #             forward_frames += 1
    #             cv2.rectangle(img, (0, 0), (w_img, h_img), (0, 0, 255), 8)
    #             winsound.Beep(1400, 100)
                
    #         else:
    #             status_text = "STATUS: GOOD POSTURE"
    #             status_color = (0, 255, 0) # 绿色完美
    #             good_frames += 1
                
    #     score = int((good_frames / total_frames) * 100) if total_frames > 0 else 100
        
    #     # 可视化核心关节
    #     for idx in [0, 7, 11, 12]:
    #         lm = pose_landmarks[idx]
    #         cv2.circle(img, (int(lm.x*w_img), int(lm.y*h_img)), 5, (0, 255, 255), -1)
    #     cv2.line(img, (int(left_ear.x*w_img), int(left_ear.y*h_img)), (int(left_shoulder.x*w_img), int(left_shoulder.y*h_img)), (255, 0, 255), 2)
        
    #     # 数据看板输出
    #     cv2.putText(img, f"Calibration Status: {'CALIBRATED' if is_calibrated else 'NOT CALIBRATED (Press C)'}", (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
    #     if is_calibrated:
    #         cv2.putText(img, f"Angle Dev: {angle_deviation:+.1f} Deg (Max: {THRESHOLD_KYPHOSIS_DEVIATION})", (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
    #         cv2.putText(img, f"Z-Depth Dev: {z_deviation:+.3f} (Max: {THRESHOLD_FORWARD_DEVIATION})", (20, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
            
    # cv2.putText(img, status_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, status_color, 2)
    # cv2.putText(img, f"SCORE: {score}%", (w_img-240, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 200, 0), 2)
    # cv2.putText(img, f"TIME: {mins:02d}:{secs:02d}", (w_img-110, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    # cv2.imshow("Smart Posture System Pro - Self-Calibration Edition", img)
    
    # 【核心改装】：不搞 cv2.imshow 了，直接把数据打包发射给 Electron
    sys.stdout.write(json.dumps(telemetry_data) + "\n")
    sys.stdout.flush()

    #允许通过q退出
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'): 
        break
    # elif key == ord('c') and detection_result.pose_landmarks:
    #     # 【机制二】：捕获当前平滑值作为用户的专属黄金坐姿原点
    #     base_angle = smooth_angle
    #     base_z_diff = smooth_z_diff
    #     is_calibrated = True
    #     print(f"\n[SUCCESS] 用户坐姿校准成功！标准角:{base_angle:.1f}°, 标准深度差:{base_z_diff:.3f}")

cap.release()
# cv2.destroyAllWindows()

# ================= 4. 自动化报告 =================
if total_frames > 0:
    print("\n" + "="*12 + " 🤖 多维行为诊断报告 " + "="*12)
    print(f"核心检测内核: MediaPipe NextGen Tasks API (Frontal Calibration)")
    print(f"综合多模态健康评分 (Overall Compliance Score): {score}%")
    print(f"细分行为空间统计 (Sub-behavioral Classification Metrics):")
    print(f"   [🟢 优良健康姿态]: {good_frames} 帧 | 占比: {(good_frames/total_frames)*100:.1f}%")
    print(f"   [🟠 骨骼异常-驼背弓背]: {kyphosis_frames} 帧 | 占比: {(kyphosis_frames/total_frames)*100:.1f}%")
    print(f"   [🔴 颈椎异常-探头前倾]: {forward_frames} 帧 | 占比: {(forward_frames/total_frames)*100:.1f}%")
    print("======================================================================")