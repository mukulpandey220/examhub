import os
os.environ["YOLO_CONFIG_DIR"] = "/tmp/Ultralytics"
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"

import cv2
import numpy as np
from typing import List, Optional
from app.core.config import settings
from app.core.types import DetectedObject, BoundingBox
from app.detectors.edge_guard import ViewportEdgeGuard

class ObjectDetector:
    """
    High-Sensitivity Phone & Peripheral Device Detector:
    Combines state-of-the-art open-source YOLO (YOLO11 foundation) with
    MediaPipe EfficientDet to reliably catch cell phones, cameras, tablets,
    and recording devices held in front of the camera.
    """
    SUSPICIOUS_LABELS = {
        "cell phone": "Mobile Phone",
        "cell_phone": "Mobile Phone",
        "phone": "Mobile Phone",
        "mobile": "Mobile Phone",
        "telephone": "Mobile Phone",
        "camera": "Camera / Recording Device",
        "webcam": "Secondary Camera Device",
        "laptop": "Secondary Laptop / Screen",
        "tv": "External Monitor / Screen",
        "monitor": "External Monitor / Screen",
        "secondary_screen": "Secondary Screen / Device",
        "tablet": "Tablet / Digital Device",
        "ipad": "Tablet / Digital Device",
        "book": "Printed Book / Study Material",
        "paper_notes": "Paper Notes / Cheat Sheet",
        "remote": "Electronic Remote / Device",
        "calculator": "Calculator / Electronic Aid",
        "smartwatch": "Smartwatch / Wearable",
        "clock": "Smartwatch / Wearable",
        "earphones_headset": "Earphones / Audio Device",
    }

    def __init__(self, yolo_path: Optional[str] = None, tflite_path: Optional[str] = None):
        self.edge_guard = ViewportEdgeGuard(edge_margin_percent=0.04)
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        root_dir = os.path.dirname(base_dir)

        # 1. Primary YOLO Detector (Prioritize YOLO11 foundation for real phone/camera recognition)
        self.yolo_model = None
        candidate_paths = [
            yolo_path,
            os.path.join(base_dir, "models", "yolo11n.pt"),
            os.path.join(root_dir, "ai", "training", "artifacts", "hf_bundle", "best.pt"),
        ]

        for p in candidate_paths:
            if p and os.path.exists(p):
                try:
                    from ultralytics import YOLO
                    self.yolo_model = YOLO(p)
                    break
                except Exception as e:
                    print(f"[ObjectDetector] YOLO load notice for {p}: {e}")

        # 2. Resilient MediaPipe TFLite Detector
        self.fallback_detector = None
        if tflite_path is None:
            tflite_path = os.path.join(base_dir, "models", "efficientdet_lite0.tflite")

        if os.path.exists(tflite_path):
            try:
                import mediapipe as mp
                from mediapipe.tasks import python
                from mediapipe.tasks.python import vision

                base_options = python.BaseOptions(model_asset_path=tflite_path)
                options = vision.ObjectDetectorOptions(
                    base_options=base_options,
                    score_threshold=min(0.35, settings.object_detection_confidence),
                    max_results=5,
                )
                self.fallback_detector = vision.ObjectDetector.create_from_options(options)
            except Exception as e:
                print(f"[ObjectDetector] MediaPipe TFLite load notice: {e}")

    def detect(self, frame_bgr: np.ndarray) -> List[DetectedObject]:
        height, width = frame_bgr.shape[:2]
        detected_objects: List[DetectedObject] = []
        conf_threshold = min(0.35, settings.object_detection_confidence)

        # 1. Run YOLO inference
        if self.yolo_model is not None:
            try:
                results = self.yolo_model.predict(
                    frame_bgr,
                    conf=conf_threshold,
                    verbose=False,
                )
                if len(results) > 0 and results[0].boxes is not None:
                    boxes = results[0].boxes
                    for box in boxes:
                        cls_id = int(box.cls[0])
                        conf = float(box.conf[0])
                        raw_name = self.yolo_model.names.get(cls_id, str(cls_id)).lower()

                        if raw_name in self.SUSPICIOUS_LABELS:
                            friendly_name = self.SUSPICIOUS_LABELS[raw_name]
                            xyxy = box.xyxy[0].cpu().numpy()
                            x1, y1, x2, y2 = float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])
                            bw, bh = x2 - x1, y2 - y1

                            clamped_box = self.edge_guard.clamp_and_refine_box(x1, y1, bw, bh, frame_bgr.shape)
                            detected_objects.append(
                                DetectedObject(
                                    label=friendly_name,
                                    confidence=round(conf, 3),
                                    box=clamped_box,
                                )
                            )
            except Exception as e:
                print(f"[ObjectDetector] YOLO inference notice: {e}")

        # 2. Run MediaPipe TFLite if no objects found via YOLO or to supplement
        if len(detected_objects) == 0 and self.fallback_detector is not None:
            try:
                import mediapipe as mp
                frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
                detection_result = self.fallback_detector.detect(mp_image)

                for detection in detection_result.detections:
                    category = detection.categories[0]
                    label_lower = category.category_name.lower()

                    if label_lower in self.SUSPICIOUS_LABELS:
                        friendly_name = self.SUSPICIOUS_LABELS[label_lower]
                        orig_bbox = detection.bounding_box
                        clamped_box = self.edge_guard.clamp_and_refine_box(
                            orig_bbox.origin_x,
                            orig_bbox.origin_y,
                            orig_bbox.width,
                            orig_bbox.height,
                            frame_bgr.shape,
                        )
                        detected_objects.append(
                            DetectedObject(
                                label=friendly_name,
                                confidence=round(float(category.score), 3),
                                box=clamped_box,
                            )
                        )
            except Exception as e:
                print(f"[ObjectDetector] MediaPipe inference notice: {e}")

        return detected_objects
