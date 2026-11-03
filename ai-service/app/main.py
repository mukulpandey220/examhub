import os
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"
os.environ["YOLO_CONFIG_DIR"] = "/tmp/Ultralytics"

import time
import base64
import cv2
import numpy as np
from typing import List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.types import (
    FrameAnalysisRequest,
    FrameAnalysisResponse,
    BoundingBox,
    FaceDetectionInfo,
    HeadPoseResult,
    LightingQuality,
    DetectedObject,
)
from app.engine.analyzer import ProctoringAnalyzer

import sys
sys.path.insert(0, "/Users/srijan/aiproctor/ai/training/scripts")
try:
    from model_registry import registry
except Exception:
    registry = None

app = FastAPI(
    title="AI Proctor Computer Vision & Inference Service",
    description="High-performance real-time face presence, 3D head pose, lighting, and object detection engine for exam proctoring.",
    version="1.2.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer: ProctoringAnalyzer | None = None
models_ready = False

@app.on_event("startup")
def startup_event():
    global analyzer, models_ready
    try:
        analyzer = ProctoringAnalyzer()
        models_ready = True
        print("AI Proctor Vision Models loaded successfully.")
    except Exception as e:
        print(f"Warning: Failed to load models during startup: {e}")
        models_ready = False

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "models_loaded": analyzer is not None,
        "service": "ai-proctor-vision",
        "timestamp": time.time(),
    }

@app.get("/ready")
def ready_check():
    if not models_ready or analyzer is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI inference models are not yet initialized.",
        )
    return {
        "ready": True,
        "models": {
            "face_landmarker": True,
            "head_pose_pnp": True,
            "object_detector": True,
            "lighting_analyzer": True,
        },
    }

@app.get("/models")
def list_models():
    models_list = []
    if registry:
        for m in registry.list_models():
            models_list.append({
                "model_identifier": m["model_identifier"],
                "version": m["version"],
                "status": m["status"],
                "device": "Apple M2 MPS / CPU",
                "capabilities": ["cell_phone", "book", "paper_notes", "calculator", "secondary_screen"],
            })
    models_list.append({
        "model_identifier": "mediapipe-face-landmarker",
        "version": "v1.2.0",
        "status": "active",
        "device": "CPU (XNNPACK)",
        "capabilities": ["face_presence", "multi_face", "3d_landmarks", "head_pose_solvepnp"],
    })
    return models_list

@app.post("/analyze/frame", response_model=FrameAnalysisResponse)
@app.post("/v1/infer/frame", response_model=FrameAnalysisResponse)
def analyze_frame(request: FrameAnalysisRequest):
    global analyzer
    if analyzer is None:
        try:
            analyzer = ProctoringAnalyzer()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Inference models are not initialized: {str(e)}",
            )

    try:
        frame_bgr = analyzer.decode_image_base64(request.image_base64)
        response = analyzer.analyze_frame(frame_bgr)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}",
        )

@app.post("/v1/infer/batch")
def infer_batch(request_payload: dict):
    frames = request_payload.get("frames", [])
    if len(frames) > 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Batch limit is 8")
    t0 = time.perf_counter()
    results = []
    for f in frames:
        req = FrameAnalysisRequest(**f)
        results.append(analyze_frame(req))
    total_ms = (time.perf_counter() - t0) * 1000.0
    return {
        "total_processed": len(results),
        "batch_latency_ms": round(total_ms, 2),
        "results": results,
    }
