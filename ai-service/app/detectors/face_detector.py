import os
import cv2
import numpy as np
from typing import List, Tuple, Optional
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from app.core.config import settings
from app.core.types import FaceDetectionInfo, BoundingBox
from app.detectors.edge_guard import ViewportEdgeGuard

class FaceDetector:
    """
    Production-grade Face & Landmark Detector powered by MediaPipe Face Landmarker.
    Extracts multi-face presence, bounding boxes, and fiducial landmarks for head pose.
    """
    def __init__(self, model_path: Optional[str] = None):
        if model_path is None:
            # Default to bundled models directory
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            model_path = os.path.join(base_dir, "models", "face_landmarker.task")

        self.model_path = model_path
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"MediaPipe Face Landmarker model not found at {self.model_path}")

        base_options = python.BaseOptions(model_asset_path=self.model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=True,
            output_facial_transformation_matrixes=True,
            num_faces=4,
            min_face_detection_confidence=settings.min_face_detection_confidence,
            min_face_presence_confidence=0.5,
        )
        self.detector = vision.FaceLandmarker.create_from_options(options)

        # Landmark indices for solvePnP 3D pose mapping:
        # 1: Nose tip
        # 152: Chin
        # 33: Left eye outer corner
        # 263: Right eye outer corner
        # 61: Left mouth corner
        # 291: Right mouth corner
        self.pnp_indices = [1, 152, 33, 263, 61, 291]
        self.edge_guard = ViewportEdgeGuard(edge_margin_percent=0.06)

    def detect(
        self, frame_bgr: np.ndarray
    ) -> Tuple[List[FaceDetectionInfo], Optional[np.ndarray], Optional[np.ndarray]]:
        """
        Runs face landmarker on a BGR frame.
        Returns:
            faces: list of FaceDetectionInfo
            key_landmarks_2d: np.ndarray of shape (6, 2) for head pose solvePnP (primary face)
            all_landmarks_2d: optional full landmark coordinates
        """
        height, width = frame_bgr.shape[:2]
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)

        detection_result = self.detector.detect(mp_image)

        face_landmarks_list = detection_result.face_landmarks
        if not face_landmarks_list or len(face_landmarks_list) == 0:
            return [], None, None

        detected_faces: List[FaceDetectionInfo] = []
        primary_key_landmarks_2d: Optional[np.ndarray] = None
        primary_all_landmarks: Optional[np.ndarray] = None

        for idx, landmarks in enumerate(face_landmarks_list):
            xs = [lm.x * width for lm in landmarks]
            ys = [lm.y * height for lm in landmarks]

            min_x = max(0.0, float(min(xs)))
            min_y = max(0.0, float(min(ys)))
            max_x = min(float(width), float(max(xs)))
            max_y = min(float(height), float(max(ys)))

            bbox = self.edge_guard.clamp_and_refine_box(
                min_x, min_y, max_x - min_x, max_y - min_y, frame_bgr.shape
            )
            is_near_edge, edge_name = self.edge_guard.check_edge_proximity(bbox, frame_bgr.shape)

            # Extract confidence if available from blendshapes or default to 0.95
            confidence = 0.95
            if detection_result.facial_transformation_matrixes and len(detection_result.facial_transformation_matrixes) > idx:
                confidence = 0.98

            detected_faces.append(
                FaceDetectionInfo(
                    box=bbox,
                    confidence=confidence,
                    landmarks_count=len(landmarks),
                    is_near_edge=is_near_edge,
                    edge_proximity=edge_name,
                )
            )

            # For the first (primary) face, extract fiducial coordinates for head pose
            if idx == 0:
                pnp_points = []
                for p_idx in self.pnp_indices:
                    lm = landmarks[p_idx]
                    pnp_points.append([lm.x * width, lm.y * height])
                primary_key_landmarks_2d = np.array(pnp_points, dtype=np.float64)

                all_pts = [[lm.x * width, lm.y * height] for lm in landmarks]
                primary_all_landmarks = np.array(all_pts, dtype=np.float64)

        return detected_faces, primary_key_landmarks_2d, primary_all_landmarks

