from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class FaceObservation(BaseModel):
    box: BoundingBox
    confidence: float
    landmarks_count: int

class HeadPoseObservation(BaseModel):
    yaw: float
    pitch: float
    roll: float
    is_deviated: bool
    deviation_direction: Optional[str] = None

class ObjectObservation(BaseModel):
    label: str
    confidence: float
    box: BoundingBox

class LightingMetrics(BaseModel):
    mean_luminance: float
    contrast_rms: float
    status: str
    is_compromised: bool

class FrameInferenceRequest(BaseModel):
    image_base64: str
    session_id: Optional[str] = None
    client_timestamp: Optional[float] = None
    modules: Optional[List[str]] = Field(default=["face", "pose", "objects", "lighting"])

class FrameInferenceResponse(BaseModel):
    session_id: Optional[str] = None
    is_face_present: bool
    face_count: int
    faces: List[FaceObservation] = []
    head_pose: Optional[HeadPoseObservation] = None
    lighting: LightingMetrics
    detected_objects: List[ObjectObservation] = []
    observations: List[str] = []
    inference_latency_ms: float
    model_version: str = "v1.2.0-yolo-mediapipe-hybrid"
    timestamp: float

class BatchInferenceRequest(BaseModel):
    frames: List[FrameInferenceRequest]

class BatchInferenceResponse(BaseModel):
    total_processed: int
    batch_latency_ms: float
    results: List[FrameInferenceResponse]

class ModelInfo(BaseModel):
    model_identifier: str
    version: str
    status: str
    device: str
    capabilities: List[str]

