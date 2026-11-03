import base64
import time
import cv2
import numpy as np
from typing import List, Tuple
from app.core.config import settings
from app.core.types import (
    FrameAnalysisResponse,
    HeadPoseResult,
)
from app.detectors.lighting_analyzer import LightingAnalyzer
from app.detectors.face_detector import FaceDetector
from app.detectors.head_pose import HeadPoseEstimator
from app.detectors.object_detector import ObjectDetector
from app.detectors.gaze_estimator import GazeEstimator

class ProctoringAnalyzer:
    """
    Central inference engine uniting face presence, multi-face counts,
    3D head pose estimation, fine-grained iris gaze tracking, ambient lighting analysis,
    viewport edge boundary guards, and object detection.
    """
    def __init__(self):
        self.lighting_analyzer = LightingAnalyzer()
        self.head_pose_estimator = HeadPoseEstimator()
        self.gaze_estimator = GazeEstimator()
        self.face_detector = FaceDetector()
        self.object_detector = ObjectDetector()

    def decode_image_base64(self, base64_str: str) -> np.ndarray:
        # Strip data URL prefix if present (e.g. data:image/jpeg;base64,...)
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]

        image_data = base64.b64decode(base64_str)
        np_arr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image is None:
            raise ValueError("Failed to decode image from provided base64 string")

        return image

    def analyze_frame(self, frame_bgr: np.ndarray) -> FrameAnalysisResponse:
        start_time = time.perf_counter()
        technical_warnings: List[str] = []

        # 1. Resize if image is excessively large to bound latency
        h, w = frame_bgr.shape[:2]
        if max(h, w) > settings.max_image_dimension:
            scale = settings.max_image_dimension / float(max(h, w))
            frame_bgr = cv2.resize(frame_bgr, (int(w * scale), int(h * scale)))

        # 2. Lighting Quality & Sharpness Analysis
        lighting = self.lighting_analyzer.analyze(frame_bgr)
        if lighting.status == "underexposed":
            technical_warnings.append("Low ambient lighting detected. Please increase room lighting.")
        elif lighting.status == "overexposed":
            technical_warnings.append("Excessive backlighting or glare detected.")
        elif lighting.is_blurred:
            technical_warnings.append("Camera lens appears blurred or obscured; please ensure clean lens.")

        # 3. Face Presence, Boundary Edge Guard & Landmark Detection
        faces, key_landmarks, all_landmarks = self.face_detector.detect(frame_bgr)
        face_count = len(faces)
        is_face_present = face_count > 0

        if not is_face_present:
            if lighting.is_compromised:
                technical_warnings.append("Camera lighting compromised; face detection may be degraded.")
            else:
                technical_warnings.append("No face detected in camera viewport.")
        elif face_count > 1:
            technical_warnings.append(f"Multiple faces ({face_count}) detected in camera viewport.")
        else:
            # Check edge proximity for the candidate's face
            primary_face = faces[0]
            if primary_face.is_near_edge:
                technical_warnings.append(
                    f"Candidate face is near viewport border ({primary_face.edge_proximity}); keep centered."
                )

        # 4. Head Pose & Fine-Grained Iris Gaze Estimation (Primary Face)
        head_pose: HeadPoseResult | None = None
        if is_face_present and key_landmarks is not None:
            head_pose = self.head_pose_estimator.estimate(frame_bgr.shape, key_landmarks)
            if head_pose:
                # Augment with iris gaze tracking if full landmarks are present
                if all_landmarks is not None:
                    gaze_info = self.gaze_estimator.estimate_gaze(all_landmarks, frame_bgr.shape)
                    head_pose.eye_gaze_direction = gaze_info["gaze_direction"]
                    head_pose.eye_aspect_ratio = gaze_info["eye_aspect_ratio"]

                    if gaze_info["eyes_closed"]:
                        technical_warnings.append("Prolonged eye closure or downward face angle detected.")
                    elif gaze_info["is_gaze_deviated"] and not head_pose.is_deviated:
                        technical_warnings.append(
                            f"Eye gaze directed away from screen ({gaze_info['gaze_direction']})."
                        )

                if head_pose.is_deviated:
                    technical_warnings.append(
                        f"Head oriented away from screen ({head_pose.deviation_direction})."
                    )

        # 5. Suspicious Peripheral Object Detection
        detected_objects = self.object_detector.detect(frame_bgr)
        for obj in detected_objects:
            technical_warnings.append(
                f"Potential unauthorized device detected: {obj.label} (confidence: {obj.confidence:.2f})"
            )

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        return FrameAnalysisResponse(
            face_count=face_count,
            is_face_present=is_face_present,
            faces=faces,
            head_pose=head_pose,
            lighting=lighting,
            objects=detected_objects,
            inference_latency_ms=round(latency_ms, 2),
            technical_warnings=technical_warnings,
            model_version="v1.2.0-mediapipe-hybrid",
            processed_at=time.time(),
        )

