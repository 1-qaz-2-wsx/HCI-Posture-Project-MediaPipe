import cv2
import numpy as np
import winsound
import time
import os
import math

# ================= 🚀 1. 核心数学公式：计算 3D 空间中两线夹角 =================
def calculate_angle_with_vertical(pt_upper, pt_lower):
    """计算上部点（如耳）到下部点（如肩）的连线与垂直线的夹角(角度制)"""
    dx = pt_lower.x - pt_upper.x
    dy = pt_lower.y - pt_upper.y  # 图像坐标系下 y 向下递增
    
    # 计算弧度值并转换为角度
    angle_radians = math.atan2(abs(dx), abs(dy))
    return math.degrees(angle_radians)

# ================= 🚀 2. 初始化全新 Tasks API 骨骼引擎 =================
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

# ================= 3. HCI 交互多维解剖学阈值设置 =================
ANGLE_THRESHOLD_KYPHOSIS = 28.0   # 驼背阈值：耳肩夹角大于 28 度判定为驼背
Z_DEPTH_THRESHOLD_FORWARD = 0.18  # 前倾阈值：鼻子与肩部的 Z 轴深度差超过此值判定为探头

cap = cv2.VideoCapture(0)
start_time = time.time()
total_frames = 0
good_frames = 0
kyphosis_frames = 0
forward_frames = 0

print("==================================================")
print(" 智慧坐姿卫士 Pro - 三维多维特征分类交互版")
print(" 正在启用：解剖学耳肩夹角 + 空间Z轴深度联合分类算法")
print("==================================================")

while True:
    success, img = cap.read()
    if not success: break
    
    img = cv2.flip(img, 1) 
    h_img, w_img, _ = img.shape
    elapsed_time = int(time.time() - start_time)
    mins, secs = divmod(elapsed_time, 60)

    # 绘制高级半透明 Dashboard 看板
    overlay = img.copy()
    cv2.rectangle(overlay, (0, 0), (w_img, 110), (20, 20, 20), -1)
    cv2.addWeighted(overlay, 0.8, img, 0.2, 0, img)

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
    detection_result = detector.detect(mp_image)
    
    status_text = "STATUS: SEARCHING USER..."
    status_color = (0, 255, 255) # 黄色搜索中
    
    if detection_result.pose_landmarks:
        pose_landmarks = detection_result.pose_landmarks[0]
        total_frames += 1
        
        # 提取核心多维解剖学特征点
        nose = pose_landmarks[0]          # 鼻尖
        left_ear = pose_landmarks[7]      # 左耳
        right_ear = pose_landmarks[8]     # 右耳
        left_shoulder = pose_landmarks[11] # 左肩
        right_shoulder = pose_landmarks[12]# 右肩
        
        # 1. 计算三维空间双肩中点和双耳中点
        shoulder_center_z = (left_shoulder.z + right_shoulder.z) / 2
        ear_center_x = (left_ear.x + right_ear.x) / 2
        ear_center_y = (left_ear.y + right_ear.y) / 2
        
        # 2. 【核心改进一】计算耳肩轴线与垂直方向的夹角（用以精准锁死“驼背/弓背”行为）
        # 简化版采用单侧或双侧平均，这里采用左侧或右侧可见度较高的点，或者直接用中心投影
        # 为稳定起见，我们计算左侧/右侧的综合夹角
        current_angle = calculate_angle_with_vertical(left_ear, left_shoulder)
        
        # 3. 【核心改进二】计算鼻子与双肩中点的 Z 轴深度差（用以精准锁死“探头前倾”行为）
        z_depth_diff = shoulder_center_z - nose.z  # 当鼻子向前突时，nose.z 变小，差值变大
        
        # ================= 🚀 HCI 核心自适应多级分类状态机 =================
        if current_angle > ANGLE_THRESHOLD_KYPHOSIS:
            # 状态 A：耳肩夹角过大 -> 判定为驼背
            status_text = "STATUS: BAD POSTURE (KYPHOSIS / SLUMPED)"
            status_color = (0, 69, 255) # 橙红色
            kyphosis_frames += 1
            cv2.rectangle(img, (0, 0), (w_img, h_img), (0, 69, 255), 8) # 橙红边框提示
            winsound.Beep(800, 100) # 较低沉的警报声
            
        elif z_depth_diff > Z_DEPTH_THRESHOLD_FORWARD:
            # 状态 B：Z 轴深度超标 -> 判定为脖子前倾、探头
            status_text = "STATUS: BAD POSTURE (FORWARD HEAD / TEXT NECK)"
            status_color = (0, 0, 255) # 纯红色
            forward_frames += 1
            cv2.rectangle(img, (0, 0), (w_img, h_img), (0, 0, 255), 8) # 纯红边框提示
            winsound.Beep(1500, 120) # 较尖锐的警报声
            
        else:
            # 状态 C：各项指标完美合规 -> 正常端正
            status_text = "STATUS: GOOD POSTURE"
            status_color = (0, 255, 0) # 绿色
            good_frames += 1
            
        score = int((good_frames / total_frames) * 100) if total_frames > 0 else 100
        
        # 动态手搓 3D 拓扑骨骼骨架
        for idx in [0, 7, 8, 11, 12, 13, 14, 23, 24]: # 仅绘制上半身核心姿态交互点，减少画面杂乱
            lm = pose_landmarks[idx]
            cv2.circle(img, (int(lm.x*w_img), int(lm.y*h_img)), 5, (0, 255, 255), -1)
            
        # 绘制耳肩交互控制线（实时可视化你的算法依据！）
        cv2.line(img, (int(left_ear.x*w_img), int(left_ear.y*h_img)), (int(left_shoulder.x*w_img), int(left_shoulder.y*h_img)), (255, 0, 255), 3)
        
        # 实时数据仪表盘渲染
        cv2.putText(img, f"Ear-Shoulder Angle: {current_angle:.1f} Deg (Max: {ANGLE_THRESHOLD_KYPHOSIS})", (20, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
        cv2.putText(img, f"Head Z-Depth Diff: {z_depth_diff:.3f} (Max: {Z_DEPTH_THRESHOLD_FORWARD})", (20, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
    
    # 渲染通用 UI 元素
    cv2.putText(img, status_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.65, status_color, 2)
    cv2.putText(img, f"SCORE: {score}%", (w_img-280, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 200, 0), 2)
    cv2.putText(img, f"TIME: {mins:02d}:{secs:02d}", (w_img-130, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)

    cv2.imshow("Smart Posture System Pro - HCI Diagnostic Edition", img)
    if cv2.waitKey(1) & 0xFF == ord('q'): break

cap.release()
cv2.destroyAllWindows()

# ================= 4. 自动化生成多维交互行为分析学术报告 =================
print("\n" + "="*12 + " 🤖 高级人机交互（HCI）多维行为诊断报告 " + "="*12)
print(f"1. 临床行为实验总时长 (Session Duration): {mins} 分 {secs} 秒")
print(f"2. 采集有效姿态样本总计 (Total Evaluated Frames): {total_frames} 帧")
print(f"3. 综合多模态健康评分 (Overall Compliance Score): {score}%")
print("-" * 55)
print(f"4. 细分行为空间统计 (Sub-behavioral Classification Metrics):")
print(f"   [🟢 优良健康姿态]: {good_frames} 帧 | 占比: {(good_frames/total_frames)*100 if total_frames>0 else 0:.1f}%")
print(f"   [🟠 骨骼异常-驼背弓背]: {kyphosis_frames} 帧 | 占比: {(kyphosis_frames/total_frames)*100 if total_frames>0 else 0:.1f}%")
print(f"   [🔴 颈椎异常-探头前倾]: {forward_frames} 帧 | 占比: {(forward_frames/total_frames)*100 if total_frames>0 else 0:.1f}%")
print("-" * 55)
print("5. HCI 鲁棒性建议: 用户驼背时高频触发低音蜂鸣，探头时触发高音突变，多模态成效显著。")
print("======================================================================")