import os
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"
os.environ["YOLO_CONFIG_DIR"] = "/tmp/Ultralytics"

import time
import base64
import cv2
import numpy as np
from typing import List
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.schemas import (
    FrameInferenceRequest,
    FrameInferenceResponse,
    BatchInferenceRequest,
    BatchInferenceResponse,
    ModelInfo,
    BoundingBox,
    FaceObservation,
    HeadPoseObservation,
    ObjectObservation,
    LightingMetrics,
)

# Import existing high-performance detectors
import sys
sys.path.insert(0, "/Users/srijan/aiproctor/ai-service")
sys.path.insert(0, "/Users/srijan/aiproctor/ai/training/scripts")

from app.detectors.lighting_analyzer import LightingAnalyzer
from app.detectors.head_pose import HeadPoseEstimator
from app.detectors.face_detector import FaceDetector
from app.detectors.object_detector import ObjectDetector
from model_registry import registry

app = FastAPI(
    title="AI Proctoring Inference Service",
    description="Production-grade AI microservice providing real-time face presence, 3D head pose, lighting analysis, and examination object detection.",
    version="1.2.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singletons
lighting_analyzer: LightingAnalyzer | None = None
head_pose_estimator: HeadPoseEstimator | None = None
face_detector: FaceDetector | None = None
object_detector: ObjectDetector | None = None
models_ready = False

@app.on_event("startup")
def startup_event():
    global lighting_analyzer, head_pose_estimator, face_detector, object_detector, models_ready
    try:
        lighting_analyzer = LightingAnalyzer()
        head_pose_estimator = HeadPoseEstimator()
        face_detector = FaceDetector()
        object_detector = ObjectDetector()
        models_ready = True
        print("✅ All AI Proctor models loaded into memory successfully.")
    except Exception as e:
        print(f"⚠️ Model startup warning: {e}")
        models_ready = False

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.service_name,
        "version": settings.version,
        "timestamp": time.time(),
    }

@app.get("/ready")
def readiness_check():
    if not models_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI inference models are not yet initialized.",
        )
    return {
        "ready": True,
        "models": {
            "face_landmarker": face_detector is not None,
            "head_pose_pnp": head_pose_estimator is not None,
            "object_detector": object_detector is not None,
            "lighting_analyzer": lighting_analyzer is not None,
        },
    }

@app.get("/models", response_model=List[ModelInfo])
def list_models():
    registered = registry.list_models()
    output = []
    for m in registered:
        output.append(
            ModelInfo(
                model_identifier=m["model_identifier"],
                version=m["version"],
                status=m["status"],
                device="Apple M2 MPS / CPU",
                capabilities=["cell_phone", "book", "paper_notes", "calculator", "secondary_screen"],
            )
        )
    # Default built-in vision pipeline
    output.append(
        ModelInfo(
            model_identifier="mediapipe-face-landmarker",
            version="v1.2.0",
            status="active",
            device="CPU (XNNPACK)",
            capabilities=["face_presence", "multi_face", "3d_landmarks", "head_pose_solvepnp"],
        )
    )
    return output

def decode_image(base64_str: str) -> np.ndarray:
    if "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]
    raw_data = base64.b64decode(base64_str)
    np_arr = np.frombuffer(raw_data, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Invalid image format or corrupted base64 buffer")
    return image

def process_single_frame(req: FrameInferenceRequest) -> FrameInferenceResponse:
    t0 = time.perf_counter()
    frame = decode_image(req.image_base64)
    observations: List[str] = []

    # 1. Lighting analysis
    quality = lighting_analyzer.analyze(frame)
    if quality.status == "underexposed":
        observations.append("Low ambient lighting detected. Adjust lighting to prevent degraded monitoring.")
    elif quality.status == "overexposed":
        observations.append("High glare or backlighting detected.")

    lighting_metric = LightingMetrics(
        mean_luminance=quality.mean_luminance,
        contrast_rms=quality.contrast_rms,
        status=quality.status,
        is_compromised=quality.is_compromised,
    )

    # 2. Face detection & 3D Pose
    faces, key_landmarks, _ = face_detector.detect(frame)
    face_count = len(faces)
    is_face_present = face_count > 0

    face_observations = [
        FaceObservation(
            box=BoundingBox(
                x=f.box.x,
                y=f.box.y,
                width=f.box.width,
                height=f.box.height,
            ),
            confidence=f.confidence,
            landmarks_count=f.landmarks_count,
        )
        for f in faces
    ]

    if not is_face_present:
        if quality.is_compromised:
            observations.append("Lighting compromised; face presence uncertain.")
        else:
            observations.append("No face detected in webcam frame.")
    elif face_count > 1:
        observations.append(f"Multiple faces ({face_count}) observed in frame.")

    head_pose_obs: HeadPoseObservation | None = None
    if is_face_present and key_landmarks is not None:
        pose = head_pose_estimator.estimate(frame.shape, key_landmarks)
        if pose:
            head_pose_obs = HeadPoseObservation(
                yaw=pose.yaw,
                pitch=pose.pitch,
                roll=pose.roll,
                is_deviated=pose.is_deviated,
                deviation_direction=pose.deviation_direction,
            )
            if pose.is_deviated:
                observations.append(f"Gaze deviation observed: looking {pose.deviation_direction}.")

    # 3. Object Detection
    detected_objs = object_detector.detect(frame)
    obj_observations = [
        ObjectObservation(
            label=o.label,
            confidence=o.confidence,
            box=BoundingBox(x=o.box.x, y=o.box.y, width=o.box.width, height=o.box.height),
        )
        for o in detected_objs
    ]
    for o in detected_objs:
        observations.append(f"Potential unpermitted item detected: {o.label} (confidence: {o.confidence:.2f})")

    latency_ms = (time.perf_counter() - t0) * 1000.0

    return FrameInferenceResponse(
        session_id=req.session_id,
        is_face_present=is_face_present,
        face_count=face_count,
        faces=face_observations,
        head_pose=head_pose_obs,
        lighting=lighting_metric,
        detected_objects=obj_observations,
        observations=observations,
        inference_latency_ms=round(latency_ms, 2),
        model_version="v1.2.0-yolo-mediapipe-hybrid",
        timestamp=time.time(),
    )

@app.post("/v1/infer/frame", response_model=FrameInferenceResponse)
def infer_frame(req: FrameInferenceRequest):
    try:
        return process_single_frame(req)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Inference error: {str(e)}")

@app.post("/v1/infer/batch", response_model=BatchInferenceResponse)
def infer_batch(req: BatchInferenceRequest):
    if len(req.frames) > settings.max_batch_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Batch size exceeds maximum limit of {settings.max_batch_size}",
        )
    t0 = time.perf_counter()
    results = [process_single_frame(f) for f in req.frames]
    total_ms = (time.perf_counter() - t0) * 1000.0
    return BatchInferenceResponse(
        total_processed=len(results),
        batch_latency_ms=round(total_ms, 2),
        results=results,
    )

# Backwards compatibility endpoint
@app.post("/analyze/frame")
def analyze_frame_legacy(req: FrameInferenceRequest):
    return process_single_frame(req)

