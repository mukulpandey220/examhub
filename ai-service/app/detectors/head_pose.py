import cv2
import numpy as np
from typing import Optional, List, Tuple
from app.core.config import settings
from app.core.types import HeadPoseResult
from app.detectors.temporal_filter import HeadPoseSmoother

class HeadPoseEstimator:
    """
    3D Head Pose and Orientation Estimator using Perspective-n-Point (solvePnP)
    mapping 2D facial landmarks to an anthropometric 3D facial model.
    Includes temporal smoothing to refine angle edges and prevent jitter near thresholds.
    """
    def __init__(
        self,
        max_yaw: float = settings.max_yaw_angle_deg,
        max_pitch: float = settings.max_pitch_angle_deg,
    ):
        self.max_yaw = max_yaw
        self.max_pitch = max_pitch
        self.smoother = HeadPoseSmoother()

        # Anthropometric 3D Canonical Facial Model Points (in millimeters)
        self.model_points_3d = np.array([
            (0.0, 0.0, 0.0),             # Nose tip
            (0.0, -330.0, -65.0),        # Chin
            (-225.0, 170.0, -135.0),     # Left eye outer corner
            (225.0, 170.0, -135.0),      # Right eye outer corner
            (-150.0, -150.0, -125.0),    # Left mouth corner
            (150.0, -150.0, -125.0),     # Right mouth corner
        ], dtype=np.float64)

    def estimate(
        self,
        image_shape: Tuple[int, int, int],
        image_points_2d: np.ndarray,
        smooth: bool = True,
        timestamp: Optional[float] = None,
    ) -> Optional[HeadPoseResult]:
        """
        Calculates Euler angles (yaw, pitch, roll) from 6 key facial points.
        image_points_2d must be an array of shape (6, 2) in pixel coordinates:
        [nose_tip, chin, left_eye, right_eye, left_mouth, right_mouth]
        """
        height, width = image_shape[:2]

        if image_points_2d is None or len(image_points_2d) < 6:
            return None

        # Approximate camera intrinsic matrix assuming square pixels
        focal_length = float(width)
        center = (float(width) / 2.0, float(height) / 2.0)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1],
        ], dtype=np.float64)

        dist_coeffs = np.zeros((4, 1), dtype=np.float64)  # Assume minimal radial distortion

        # Solve Perspective-n-Point
        success, rvec, tvec = cv2.solvePnP(
            self.model_points_3d,
            image_points_2d.astype(np.float64),
            camera_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )

        if not success:
            return None

        # Convert rotation vector to 3x3 rotation matrix
        rotation_matrix, _ = cv2.Rodrigues(rvec)

        # Decompose rotation matrix into Euler angles
        # RQDecomp3x3 decomposes a 3x3 matrix into upper triangular and orthogonal
        angles, _, _, _, _, _ = cv2.RQDecomp3x3(rotation_matrix)
        
        # In Perspective-n-Point with standard facial anthropometry, facing the camera
        # produces a nominal pitch around ~168.2 degrees due to camera vs model coordinate frames.
        # Calibrate pitch relative to frontal facing baseline.
        raw_pitch = float(angles[0])
        pitch = raw_pitch - 168.23
        yaw = float(angles[1])
        roll = float(angles[2])

        if smooth:
            yaw, pitch, roll = self.smoother.smooth(yaw, pitch, roll, timestamp)

        # Normalize yaw orientation:
        # Looking right: yaw < 0 or > 0 depending on camera reflection.
        # We classify deviation if absolute angle exceeds threshold.
        is_deviated = abs(yaw) > self.max_yaw or abs(pitch) > self.max_pitch

        direction = None
        if is_deviated:
            if abs(yaw) > abs(pitch):
                direction = "right" if yaw < 0 else "left"
            else:
                direction = "up" if pitch > 0 else "down"

        return HeadPoseResult(
            yaw=round(yaw, 2),
            pitch=round(pitch, 2),
            roll=round(roll, 2),
            is_deviated=is_deviated,
            deviation_direction=direction,
            smoothed=smooth,
        )
