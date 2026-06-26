
import cv2
import sys
import os

# Make sure we can import from backend/services
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.pose_engine import PoseEngine

def test_video(video_path: str, exercise: str = "squat"):
    engine = PoseEngine(exercise)
    cap    = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print(f"ERROR: Could not open {video_path}")
        return

    frame_count = 0
    rep_frames  = []

    print(f"Testing {exercise} on: {video_path}")
    print("-" * 50)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        _, buf = cv2.imencode(".jpg", frame)
        result = engine.process_frame(buf.tobytes())

        # Print every 30 frames so you can see state transitions
        if frame_count % 30 == 0:
            state      = result.get("state", "?")
            rep_count  = result.get("rep_count", 0)
            detected   = result.get("landmarks_detected", False)
            angles     = result.get("angles", {})
            avg_angle  = angles.get("avg_knee") or angles.get("avg_elbow")
            print(
                f"Frame {frame_count:>4} | "
                f"State: {state:<10} | "
                f"Reps: {rep_count} | "
                f"Landmarks: {detected} | "
                f"Angle: {round(avg_angle, 1) if avg_angle else 'N/A'}"
            )

        # Print every completed rep
        if result.get("rep_just_completed"):
            score      = result.get("form_score")
            violations = result.get("violations", [])
            cue        = result.get("voice_cue")
            print()
            print(f"  ✅ REP {result['rep_count']} COMPLETED")
            print(f"     form_score : {score}")
            print(f"     violations : {violations}")
            print(f"     voice_cue  : {cue}")
            print()
            rep_frames.append(result)

    cap.release()

    print("-" * 50)
    print(f"Total frames processed : {frame_count}")
    print(f"Total reps counted     : {engine.state_machine.rep_count}")

    if rep_frames:
        scores = [r["form_score"] for r in rep_frames if r["form_score"] is not None]
        if scores:
            print(f"Avg form score         : {round(sum(scores)/len(scores), 2)}")
            print(f"Best form score        : {max(scores)}")
    else:
        print("No reps detected — check thresholds or video quality")


if __name__ == "__main__":
    # Default: looks for squat_test.mp4 in the same folder
    video = sys.argv[1] if len(sys.argv) > 1 else "squat_test.mp4"
    exer  = sys.argv[2] if len(sys.argv) > 2 else "squat"
    test_video(video, exer)