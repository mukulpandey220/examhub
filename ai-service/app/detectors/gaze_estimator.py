import numpy as np
from typing import Optional, Tuple, Dict, Any
from app.detectors.temporal_filter import AdaptiveEMAFilter

class GazeEstimator:
    """
    Fine-grained ocular gaze and iris tracking.
    Computes horizontal/vertical eye gaze ratios and Eye Aspect Ratio (EAR)
    from MediaPipe iris and eyelid landmarks (points 468-477, 33, 133, 263, 362).
    """
    def __init__(
        self,
        horizontal_deviation_threshold: float = 0.16,  # deviation from 0.50 baseline
        ear_closure_threshold: float = 0.14,
    ):
        self.horizontal_threshold = horizontal_deviation_threshold
        self.ear_closure_threshold = ear_closure_threshold
        self.smooth_h_ratio = AdaptiveEMAFilter(min_alpha=0.35, max_alpha=0.85)
        self.smooth_ear = AdaptiveEMAFilter(min_alpha=0.35, max_alpha=0.85)

    def estimate_gaze(
        self,
        all_landmarks_2d: np.ndarray,
        frame_shape: Tuple[int, int, ...]
    ) -> Dict[str, Any]:
        """
        all_landmarks_2d: array of shape (N, 2) in pixel space, where N >= 478
        Returns dictionary with gaze metrics and direction.
        """
        if all_landmarks_2d is None or len(all_landmarks_2d) < 478:
            return {
                "horizontal_ratio": 0.5,
                "vertical_ratio": 0.5,
                "eye_aspect_ratio": 0.28,
                "gaze_direction": "centered",
                "is_gaze_deviated": False,
                "eyes_closed": False,
            }

        pts = all_landmarks_2d

        # Left Eye Landmark Indices
        l_iris = pts[468]
        l_outer = pts[33]
        l_inner = pts[133]
        l_upper = pts[159]
        l_lower = pts[145]

        # Right Eye Landmark Indices
        r_iris = pts[473]
        r_inner = pts[362]
        r_outer = pts[263]
        r_upper = pts[386]
        r_lower = pts[374]

        # 1. Horizontal Gaze Ratio (Normalized position of iris between eye corners)
        l_eye_w = max(abs(l_inner[0] - l_outer[0]), 1e-4)
        r_eye_w = max(abs(r_outer[0] - r_inner[0]), 1e-4)

        l_h_ratio = (l_iris[0] - min(l_outer[0], l_inner[0])) / l_eye_w
        r_h_ratio = (r_iris[0] - min(r_inner[0], r_outer[0])) / r_eye_w
        raw_h_ratio = float((l_h_ratio + r_h_ratio) / 2.0)
        h_ratio = self.smooth_h_ratio.filter(raw_h_ratio)

        # 2. Eye Aspect Ratio (EAR) for blink / eye closure / downward gaze
        l_eye_h = abs(l_upper[1] - l_lower[1])
        r_eye_h = abs(r_upper[1] - r_lower[1])
        l_ear = l_eye_h / l_eye_w
        r_ear = r_eye_h / r_eye_w
        raw_ear = float((l_ear + r_ear) / 2.0)
        ear = self.smooth_ear.filter(raw_ear)

        eyes_closed = ear < self.ear_closure_threshold
        is_gaze_deviated = False
        gaze_direction = "centered"

        if eyes_closed:
            gaze_direction = "eyes_closed"
            is_gaze_deviated = True
        elif h_ratio < (0.50 - self.horizontal_threshold):
            gaze_direction = "left"
            is_gaze_deviated = True
        elif h_ratio > (0.50 + self.horizontal_threshold):
            gaze_direction = "right"
            is_gaze_deviated = True
        elif ear < 0.18:
            gaze_direction = "down"
            is_gaze_deviated = True

        return {
            "horizontal_ratio": round(h_ratio, 3),
            "vertical_ratio": round(ear, 3),
            "eye_aspect_ratio": round(ear, 3),
            "gaze_direction": gaze_direction,
            "is_gaze_deviated": is_gaze_deviated,
            "eyes_closed": eyes_closed,
        }

    def reset(self):
        self.smooth_h_ratio.reset()
        self.smooth_ear.reset()

