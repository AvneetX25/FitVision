import numpy as np
import mediapipe as mp
import cv2
import base64
import time
from typing import Optional
from enum import Enum, auto

mp_pose = mp.solutions.pose

def calculate_angle(a: tuple, b: tuple, c: tuple) -> float:
    """
    a, b, c are (x, y) tuples. b is the vertex (the joint).
    Returns angle in degrees at joint b.
    """
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = (
        np.arctan2(c[1] - b[1], c[0] - b[0])
        - np.arctan2(a[1] - b[1], a[0] - b[0])
    )
    angle = np.abs(np.degrees(radians))
    return 360 - angle if angle > 180 else angle


def extract_landmarks(results, exercise: str = "squat") -> Optional[dict]:
    """
    Extract only the landmarks needed for the specific exercise.
    Squat  → both sides (hips, knees, ankles) — symmetry scoring enabled
    Pushup → best visible side only (shoulder, elbow, wrist) — one arm always occluded
    Curl   → both sides (shoulders, elbows, wrists) — symmetry scoring enabled
    """
    if not results.pose_landmarks:
        return None

    lm      = results.pose_landmarks.landmark
    MIN_VIS = 0.5

    """if exercise == "squat":
        required = {
            "left_hip":    mp_pose.PoseLandmark.LEFT_HIP,
            "right_hip":   mp_pose.PoseLandmark.RIGHT_HIP,
            "left_knee":   mp_pose.PoseLandmark.LEFT_KNEE,
            "right_knee":  mp_pose.PoseLandmark.RIGHT_KNEE,
            "left_ankle":  mp_pose.PoseLandmark.LEFT_ANKLE,
            "right_ankle": mp_pose.PoseLandmark.RIGHT_ANKLE,
        }
        extracted = {}
        for name, landmark_id in required.items():
            point = lm[landmark_id]
            if point.visibility < MIN_VIS:
                return None
            extracted[name] = (point.x, point.y)
        return extracted"""
    if exercise == "squat":
        required = {
            "left_hip":    mp_pose.PoseLandmark.LEFT_HIP,
            "right_hip":   mp_pose.PoseLandmark.RIGHT_HIP,
            "left_knee":   mp_pose.PoseLandmark.LEFT_KNEE,
            "right_knee":  mp_pose.PoseLandmark.RIGHT_KNEE,
            "left_ankle":  mp_pose.PoseLandmark.LEFT_ANKLE,
            "right_ankle": mp_pose.PoseLandmark.RIGHT_ANKLE,
        }
        extracted = {}
        for name, landmark_id in required.items():
            point = lm[landmark_id]
            extracted[name] = (point.x, point.y) if point.visibility >= MIN_VIS else None

        # Hips and knees are mandatory — ankles optional
        mandatory = ["left_hip", "right_hip", "left_knee", "right_knee"]
        if any(extracted[k] is None for k in mandatory):
            return None

        # If ankles missing, synthesise a point directly below the knee
        for side in ("left", "right"):
            if extracted[f"{side}_ankle"] is None:
                kx, ky = extracted[f"{side}_knee"]
                extracted[f"{side}_ankle"] = (kx, ky + 0.2)  # estimated ankle position

        return extracted

    elif exercise == "pushup":
        # Pick the more visible side — one arm is always occluded in side-view pushups
        left_vis  = lm[mp_pose.PoseLandmark.LEFT_ELBOW].visibility
        right_vis = lm[mp_pose.PoseLandmark.RIGHT_ELBOW].visibility

        if left_vis >= right_vis:
            side = {
                "shoulder": mp_pose.PoseLandmark.LEFT_SHOULDER,
                "elbow":    mp_pose.PoseLandmark.LEFT_ELBOW,
                "wrist":    mp_pose.PoseLandmark.LEFT_WRIST,
            }
        else:
            side = {
                "shoulder": mp_pose.PoseLandmark.RIGHT_SHOULDER,
                "elbow":    mp_pose.PoseLandmark.RIGHT_ELBOW,
                "wrist":    mp_pose.PoseLandmark.RIGHT_WRIST,
            }

        extracted = {}
        for name, landmark_id in side.items():
            point = lm[landmark_id]
            if point.visibility < MIN_VIS:
                return None
            extracted[name] = (point.x, point.y)
        return extracted

    elif exercise == "curl":
        left_vis  = lm[mp_pose.PoseLandmark.LEFT_ELBOW].visibility
        right_vis = lm[mp_pose.PoseLandmark.RIGHT_ELBOW].visibility

        if left_vis >= right_vis:
            side = {
                "shoulder": mp_pose.PoseLandmark.LEFT_SHOULDER,
                "elbow":    mp_pose.PoseLandmark.LEFT_ELBOW,
                "wrist":    mp_pose.PoseLandmark.LEFT_WRIST,
            }
        else:
            side = {
                "shoulder": mp_pose.PoseLandmark.RIGHT_SHOULDER,
                "elbow":    mp_pose.PoseLandmark.RIGHT_ELBOW,
                "wrist":    mp_pose.PoseLandmark.RIGHT_WRIST,
            }

        extracted = {}
        for name, landmark_id in side.items():
            point = lm[landmark_id]
            if point.visibility < MIN_VIS:
                return None
            extracted[name] = (point.x, point.y)
        return extracted


def get_squat_angles(landmarks: dict) -> dict:
    left_knee_angle = calculate_angle(
        landmarks["left_hip"],
        landmarks["left_knee"],
        landmarks["left_ankle"],
    )
    right_knee_angle = calculate_angle(
        landmarks["right_hip"],
        landmarks["right_knee"],
        landmarks["right_ankle"],
    )

    result = {
        "left_knee":      left_knee_angle,
        "right_knee":     right_knee_angle,
        "avg_knee":       (left_knee_angle + right_knee_angle) / 2,
        "symmetry_diff":  abs(left_knee_angle - right_knee_angle),
        "torso_lean":     None,   # only available if shoulders are extracted
    }

    # Torso angle — optional, only if shoulder landmarks exist
    if "left_shoulder" in landmarks and "right_shoulder" in landmarks:
        mid_hip = (
            (landmarks["left_hip"][0] + landmarks["right_hip"][0]) / 2,
            (landmarks["left_hip"][1] + landmarks["right_hip"][1]) / 2,
        )
        mid_shoulder = (
            (landmarks["left_shoulder"][0] + landmarks["right_shoulder"][0]) / 2,
            (landmarks["left_shoulder"][1] + landmarks["right_shoulder"][1]) / 2,
        )
        vertical_ref = (mid_hip[0], mid_hip[1] - 1)
        result["torso_lean"] = calculate_angle(vertical_ref, mid_hip, mid_shoulder)

    return result


def get_pushup_angles(landmarks: dict) -> dict:
    # Uses generic keys (shoulder/elbow/wrist) from best-side selection
    elbow_angle = calculate_angle(
        landmarks["shoulder"],
        landmarks["elbow"],
        landmarks["wrist"],
    )
    return {
        "avg_elbow":     elbow_angle,
        "symmetry_diff": 0.0,   # single side — no symmetry check
    }


def get_curl_angles(landmarks: dict) -> dict:
    elbow_angle = calculate_angle(
        landmarks["shoulder"],
        landmarks["elbow"],
        landmarks["wrist"],
    )
    return {
        "left_elbow":    elbow_angle,   # kept for compatibility
        "right_elbow":   elbow_angle,
        "avg_elbow":     elbow_angle,
        "symmetry_diff": 0.0,           # single side, no symmetry check
    }

class RepState(Enum):
    IDLE  = auto()
    START = auto()
    DOWN  = auto()
    UP    = auto()
    PAUSE = auto()


class SquatStateMachine:
    """
    State machine for squat rep counting.

    Thresholds (tunable without code change):
      DOWN_THRESHOLD : knee angle below this = person is 'down'
      UP_THRESHOLD   : knee angle above this = person is 'up' / rep counted
      PAUSE_TIMEOUT  : seconds held mid-rep before PAUSE state fires
    """

    DOWN_THRESHOLD = 110    # degrees
    UP_THRESHOLD   = 160   # degrees
    PAUSE_TIMEOUT  = 2.0   # seconds

    def __init__(self):
        self.state:      RepState = RepState.IDLE
        self.rep_count:  int      = 0
        self.down_time:  float    = 0.0   # timestamp when DOWN state entered
        self.rep_start:  float    = 0.0   # timestamp when rep started (for speed scoring)
        self.min_angle_this_rep: float = 180.0  # track deepest point reached

    def update(self, angles: dict) -> dict:
        """
        Feed one frame's angles. Returns a dict with:
          - state (str)
          - rep_count (int)
          - voice_cue (str | None)   ← frontend speaks this
          - rep_just_completed (bool)
          - min_angle_this_rep (float)
          - rep_duration (float | None)
        """
        avg_knee    = angles["avg_knee"]
        now         = time.time()
        voice_cue   = None
        rep_completed = False
        rep_duration  = None

        # Track deepest point of this rep
        if self.state in (RepState.DOWN, RepState.START):
            self.min_angle_this_rep = min(self.min_angle_this_rep, avg_knee)

        # ── State transitions ────────────────────────────────────────────
        if self.state == RepState.IDLE:
            if avg_knee > 130:    # person is reasonably upright — enter START
               self.state = RepState.START
               self.rep_start = now
               self.min_angle_this_rep = 180.00

        elif self.state == RepState.START:
            if avg_knee < self.DOWN_THRESHOLD:
                self.state    = RepState.DOWN
                self.down_time = now
                self.min_angle_this_rep = min(self.min_angle_this_rep, avg_knee)

        elif self.state == RepState.DOWN:
            elapsed_down = now - self.down_time

            if elapsed_down > self.PAUSE_TIMEOUT:
                self.state = RepState.PAUSE
                voice_cue  = "You're pausing mid-rep. Keep moving."

            elif avg_knee > self.UP_THRESHOLD:
                # ✅ Rep completed
                rep_duration   = now - self.rep_start
                self.rep_count += 1
                rep_completed  = True
                self.state     = RepState.START   # ready for next rep
                self.rep_start = now
                min_angle      = self.min_angle_this_rep
                self.min_angle_this_rep = 180.0

                return {
                    "state":              self.state.name,
                    "rep_count":          self.rep_count,
                    "voice_cue":          voice_cue,
                    "rep_just_completed": rep_completed,
                    "min_angle_this_rep": min_angle,
                    "rep_duration":       rep_duration,
                }

        elif self.state == RepState.PAUSE:
            # Exit pause when they move again
            if avg_knee < self.DOWN_THRESHOLD - 5 or avg_knee > self.UP_THRESHOLD:
                self.state     = RepState.START
                self.rep_start = now

        return {
            "state":              self.state.name,
            "rep_count":          self.rep_count,
            "voice_cue":          voice_cue,
            "rep_just_completed": rep_completed,
            "min_angle_this_rep": self.min_angle_this_rep,
            "rep_duration":       rep_duration,
        }


class PushUpStateMachine:
    DOWN_THRESHOLD = 125
    UP_THRESHOLD   = 155
    PAUSE_TIMEOUT  = 2.0

    def __init__(self):
        self.state     = RepState.IDLE
        self.rep_count = 0
        self.down_time = 0.0
        self.rep_start = 0.0
        self.min_angle_this_rep = 180.0

    def update(self, angles: dict) -> dict:
        avg_elbow   = angles["avg_elbow"]
        now         = time.time()
        voice_cue   = None
        rep_completed = False
        rep_duration  = None

        if self.state in (RepState.DOWN, RepState.START):
            self.min_angle_this_rep = min(self.min_angle_this_rep, avg_elbow)

        if self.state == RepState.IDLE:
            if avg_elbow > self.UP_THRESHOLD:
                self.state     = RepState.START
                self.rep_start = now
                self.min_angle_this_rep = 180.0

        elif self.state == RepState.START:
            if avg_elbow < self.DOWN_THRESHOLD:
                self.state     = RepState.DOWN
                self.down_time = now

        elif self.state == RepState.DOWN:
            if now - self.down_time > self.PAUSE_TIMEOUT:
                self.state    = RepState.PAUSE
                voice_cue     = "Pausing mid-rep. Push through."
            elif avg_elbow > self.UP_THRESHOLD:
                rep_duration   = now - self.rep_start
                self.rep_count += 1
                rep_completed  = True
                self.state     = RepState.START
                self.rep_start = now
                min_angle      = self.min_angle_this_rep
                self.min_angle_this_rep = 180.0
                return {
                    "state": self.state.name, "rep_count": self.rep_count,
                    "voice_cue": voice_cue, "rep_just_completed": True,
                    "min_angle_this_rep": min_angle, "rep_duration": rep_duration,
                }

        elif self.state == RepState.PAUSE:
            if avg_elbow < self.DOWN_THRESHOLD - 5 or avg_elbow > self.UP_THRESHOLD:
                self.state = RepState.START
                self.rep_start = now

        return {
            "state": self.state.name, "rep_count": self.rep_count,
            "voice_cue": voice_cue, "rep_just_completed": rep_completed,
            "min_angle_this_rep": self.min_angle_this_rep, "rep_duration": rep_duration,
        }
    


class BicepCurlStateMachine:
    """
    Curl is INVERTED: arm starts extended (high angle ~150°),
    curls to low angle (~50°). DOWN = arm extended, UP = arm curled.
    """
    DOWN_THRESHOLD = 150   # arm extended
    UP_THRESHOLD   = 50    # arm fully curled
    PAUSE_TIMEOUT  = 2.0

    def __init__(self):
        self.state     = RepState.START
        self.rep_count = 0
        self.down_time = 0.0
        self.rep_start = 0.0
        self.max_angle_this_rep = 0.0  # track fullest extension

    def update(self, angles: dict) -> dict:
        avg_elbow   = angles["avg_elbow"]
        now         = time.time()
        voice_cue   = None
        rep_completed = False
        rep_duration  = None

        if self.state in (RepState.DOWN, RepState.START):
            self.max_angle_this_rep = max(self.max_angle_this_rep, avg_elbow)

        if self.state == RepState.IDLE:
            if avg_elbow > self.DOWN_THRESHOLD:
                self.state     = RepState.START
                self.rep_start = now
                self.max_angle_this_rep = 0.0

        elif self.state == RepState.START:
            if avg_elbow < self.UP_THRESHOLD:
                self.state     = RepState.DOWN   # "DOWN" = fully curled up
                self.down_time = now

        elif self.state == RepState.DOWN:
            if now - self.down_time > self.PAUSE_TIMEOUT:
                self.state = RepState.PAUSE
                voice_cue  = "Lower the weight fully for a complete rep."
            elif avg_elbow > self.DOWN_THRESHOLD:
                rep_duration   = now - self.rep_start
                self.rep_count += 1
                rep_completed  = True
                self.state     = RepState.IDLE   # re-arm cleanly
                self.rep_start = now
                max_angle      = self.max_angle_this_rep
                self.max_angle_this_rep = 0.0
                return {
                    "state": self.state.name, "rep_count": self.rep_count,
                    "voice_cue": voice_cue, "rep_just_completed": True,
                    "min_angle_this_rep": max_angle, "rep_duration": rep_duration,
                }

        elif self.state == RepState.PAUSE:
            if avg_elbow > self.DOWN_THRESHOLD or avg_elbow < self.UP_THRESHOLD:
                self.state = RepState.START
                self.rep_start = now

        return {
            "state": self.state.name, "rep_count": self.rep_count,
            "voice_cue": voice_cue, "rep_just_completed": rep_completed,
            "min_angle_this_rep": self.max_angle_this_rep, "rep_duration": rep_duration,
        }
        

def score_squat_form(
    angles: dict,
    min_angle_this_rep: float,
    rep_duration: float,
    landmarks: dict,
) -> tuple[float, list[str]]:
    """
    Returns (form_score: float 0.0–1.0, violations: list[str])
    Start with Rules 1 and 2 only. Add more incrementally.
    """
    score      = 1.0
    violations = []

    # Rule 1 — Depth: did the knee go below 90°?
    if min_angle_this_rep > 90:
        score -= 0.25
        violations.append("depth")

    # Rule 2 — Knee alignment: knee X should stay between hip and foot X
    # Check both left and right
    for side in ("left", "right"):
        knee_x  = landmarks[f"{side}_knee"][0]
        hip_x   = landmarks[f"{side}_hip"][0]
        ankle_x = landmarks[f"{side}_ankle"][0]
    
    # Skip check if camera is side-on (landmarks too close horizontally)
        if abs(hip_x - ankle_x) < 0.05:   # less than 5% frame width apart
           continue
        
        foot_min = min(hip_x, ankle_x)
        foot_max = max(hip_x, ankle_x)
        if not (foot_min <= knee_x <= foot_max):
            score -= 0.25
            violations.append(f"{side}_knee_cave")
            break

    # Rule 3 — Symmetry (safe to add now, low complexity)
    if angles.get("symmetry_diff", 0) > 15:
        score -= 0.15
        violations.append("asymmetry")

    # Rule 4 — Speed (rep < 0.8s = too fast)
    if rep_duration and rep_duration < 0.8:
        score -= 0.15
        violations.append("too_fast")

    return max(0.0, round(score, 2)), violations


def score_pushup_form(
    angles: dict,
    min_angle_this_rep: float,
    rep_duration: float,
) -> tuple[float, list[str]]:
    score      = 1.0
    violations = []

    if min_angle_this_rep > 90:
        score -= 0.25
        violations.append("depth")

    if angles.get("symmetry_diff", 0) > 15:
        score -= 0.15
        violations.append("asymmetry")

    if rep_duration and rep_duration < 0.8:
        score -= 0.15
        violations.append("too_fast")

    return max(0.0, round(score, 2)), violations


def score_curl_form(
    angles: dict,
    min_angle_this_rep: float,   # actually max_angle for curls
    rep_duration: float,
) -> tuple[float, list[str]]:
    score      = 1.0
    violations = []

    # Rule 1: Did the arm fully extend back to ~150°?
    if min_angle_this_rep < 140:
        score -= 0.25
        violations.append("incomplete_extension")

    if angles.get("symmetry_diff", 0) > 15:
        score -= 0.15
        violations.append("asymmetry")

    return max(0.0, round(score, 2)), violations


def build_voice_cue(
    rep_count: int,
    form_score: float,
    violations: list[str],
    last_cue_time: float,
    cooldown: float = 3.0,
) -> tuple[str | None, float]:
    """
    Returns (voice_cue: str | None, updated_last_cue_time: float).
    Enforces a cooldown so the user isn't spammed.
    """
    now = time.time()
    if now - last_cue_time < cooldown:
        return None, last_cue_time   # still in cooldown

    # Map violations to human-readable cues
    cue_map = {
        "depth":               "Go lower — hit parallel.",
        "left_knee_cave":      "Left knee is caving in. Push it out.",
        "right_knee_cave":     "Right knee is caving in. Push it out.",
        "asymmetry":           "Keep both sides even.",
        "too_fast":            "Slow down. Control the movement.",
        "incomplete_extension": "Fully extend your arm at the bottom.",
    }

    if violations:
        cue = cue_map.get(violations[0], "Check your form.")
    elif form_score >= 0.9:
        cue = f"Rep {rep_count}. Perfect form."
    elif form_score >= 0.7:
        cue = f"Rep {rep_count}. Good."
    else:
        cue = f"Rep {rep_count}. Focus on form."

    # Milestone every 10 reps
    if rep_count % 10 == 0 and rep_count > 0:
        cue = f"{rep_count} reps. Keep going!"

    return cue, now

class PoseEngine:
    """
    Top-level class consumed by the WebSocket route.
    One instance per connected client — holds all state.
    """

    EXERCISE_MAP = {
        "squat":  (get_squat_angles,  SquatStateMachine,     score_squat_form),
        "pushup": (get_pushup_angles, PushUpStateMachine,    score_pushup_form),
        "curl":   (get_curl_angles,   BicepCurlStateMachine, score_curl_form),
    }

    def __init__(self, exercise: str = "squat"):
        self.exercise  = exercise
        self.pose      = mp_pose.Pose(
            min_detection_confidence=0.4,
            min_tracking_confidence=0.4,
            model_complexity=1,
        )
        angle_fn, sm_cls, score_fn = self.EXERCISE_MAP[exercise]  # unpack all 3 here
        self.get_angles    = angle_fn
        self.state_machine = sm_cls()
        self.score_fn      = score_fn   # store it — never unpack from map again
        self.last_cue_time = 0.0
        
    def _serialize_landmarks(self, results) -> list:
        """
           Returns all 33 MediaPipe landmarks as a list of dicts.
           Index position is preserved — frontend uses indices directly.
        """
        if not results.pose_landmarks:
            return []
        return [
        {
            "x": lm.x,
            "y": lm.y,
            "z": lm.z,
            "visibility": lm.visibility,
        }
        for lm in results.pose_landmarks.landmark
    ]

    def process_frame(self, frame_bytes: bytes) -> dict:
        """
        Accepts a raw JPEG frame as bytes.
        Returns the full JSON payload for the WebSocket response.
        """
        np_arr = np.frombuffer(frame_bytes, dtype=np.uint8)
        frame  = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if frame is None:
            return {"error": "Could not decode frame"}

        rgb     = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)
        all_landmarks = self._serialize_landmarks(results)

        landmarks = extract_landmarks(results, self.exercise)
        
        if landmarks is None:
            return {
                "state":              "NO_PERSON",
                "rep_count":          self.state_machine.rep_count,
                "voice_cue":          None,
                "form_score":         None,
                "violations":         [],
                "landmarks":          all_landmarks,
                "landmarks_detected": False,
                "rep_just_completed": False,
            }

        angles    = self.get_angles(landmarks)
        sm_result = self.state_machine.update(angles)

        voice_cue  = sm_result.get("voice_cue")
        form_score = None
        violations = []

        if sm_result["rep_just_completed"]:
            # Use self.score_fn — no unpacking from EXERCISE_MAP here
            if self.exercise == "squat":
                form_score, violations = self.score_fn(
                    angles,
                    sm_result["min_angle_this_rep"],
                    sm_result["rep_duration"],
                    landmarks,
                )
            else:
                form_score, violations = self.score_fn(
                    angles,
                    sm_result["min_angle_this_rep"],
                    sm_result["rep_duration"],
                )

            cue, self.last_cue_time = build_voice_cue(
                sm_result["rep_count"],
                form_score,
                violations,
                self.last_cue_time,
            )
            voice_cue = cue

        elif sm_result.get("voice_cue"):
            voice_cue = sm_result["voice_cue"]
        

        return {
            "state":              sm_result["state"],
            "rep_count":          sm_result["rep_count"],
            "form_score":         form_score,
            "voice_cue":          voice_cue,
            "violations":         violations,
            "angles":             angles,
            "landmarks":          all_landmarks,
            "landmarks_detected": True,
            "rep_just_completed": sm_result["rep_just_completed"],
        }