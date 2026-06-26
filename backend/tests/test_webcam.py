import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import cv2
from services.pose_engine import PoseEngine

engine = PoseEngine("squat")
cap    = cv2.VideoCapture(0)

if not cap.isOpened():
    print("ERROR: Could not open webcam")
    exit()

print("Webcam test started. Do squats. Press Q to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        print("ERROR: Could not read frame")
        break

    cv2.imshow("Webcam Feed", frame)   # ← shows the live camera window

    _, buf = cv2.imencode(".jpg", frame)
    result = engine.process_frame(buf.tobytes())

    state     = result.get("state", "?")
    rep_count = result.get("rep_count", 0)
    angle     = result.get("angles", {}).get("avg_knee")
    cue       = result.get("voice_cue")

    print(f"State: {state:<10} | Reps: {rep_count} | Angle: {round(angle,1) if angle else 'N/A'}", end="\r")

    if result.get("rep_just_completed"):
        print(f"\n✅ REP {rep_count} | score={result['form_score']} | violations={result['violations']}")

    if cue:
        print(f"\n🔊 CUE: {cue}")

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
print("\nDone.")