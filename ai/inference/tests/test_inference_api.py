import os
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"
os.environ["YOLO_CONFIG_DIR"] = "/tmp/Ultralytics"

import sys
sys.path.insert(0, "/Users/srijan/aiproctor/ai/inference")
sys.path.insert(0, "/Users/srijan/aiproctor/ai-service")
sys.path.insert(0, "/Users/srijan/aiproctor/ai/training/scripts")

import pytest
import base64
import cv2
import numpy as np
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def make_sample_base64_jpeg() -> str:
    img = np.full((120, 160, 3), 128, dtype=np.uint8)
    img[30:90, 40:120] = 180
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')

def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_ready_endpoint():
    # Trigger startup
    with TestClient(app) as test_client:
        res = test_client.get("/ready")
        assert res.status_code == 200
        assert res.json()["ready"] is True

def test_models_endpoint():
    res = client.get("/models")
    assert res.status_code == 200
    models = res.json()
    assert isinstance(models, list)
    assert len(models) >= 1

def test_infer_frame_valid():
    with TestClient(app) as test_client:
        jpeg_b64 = make_sample_base64_jpeg()
        res = test_client.post("/v1/infer/frame", json={
            "image_base64": jpeg_b64,
            "session_id": "test-session-001"
        })
        assert res.status_code == 200
        body = res.json()
        assert "face_count" in body
        assert "lighting" in body
        assert "inference_latency_ms" in body
        assert body["inference_latency_ms"] > 0

def test_infer_frame_corrupt_data():
    with TestClient(app) as test_client:
        res = test_client.post("/v1/infer/frame", json={
            "image_base64": "not-a-valid-base64-image!!!"
        })
        assert res.status_code == 400

def test_infer_batch():
    with TestClient(app) as test_client:
        jpeg_b64 = make_sample_base64_jpeg()
        res = test_client.post("/v1/infer/batch", json={
            "frames": [
                {"image_base64": jpeg_b64, "session_id": "batch-1"},
                {"image_base64": jpeg_b64, "session_id": "batch-2"}
            ]
        })
        assert res.status_code == 200
        body = res.json()
        assert body["total_processed"] == 2
        assert len(body["results"]) == 2

