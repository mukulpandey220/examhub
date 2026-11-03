from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class HeadPoseResult(BaseModel):
    yaw: float = Field(..., description="Horizontal rotation in degrees (-left, +right)")
    pitch: float = Field(..., description="Vertical rotation in degrees (-down, +up)")
    roll: float = Field(..., description="Tilt rotation in degrees")
    is_deviated: bool = Field(..., description="True if yaw or pitch exceeds threshold")
    deviation_direction: Optional[str] = None
    eye_gaze_direction: Optional[str] = None
    eye_aspect_ratio: Optional[float] = None
    smoothed: bool = False

class LightingQuality(BaseModel):
    mean_luminance: float
    contrast_rms: float
    status: str = Field(..., description="adequate | underexposed | overexposed")
    is_compromised: bool
    sharpness_score: Optional[float] = None
    is_blurred: bool = False

class DetectedObject(BaseModel):
    label: str
    confidence: float
    box: BoundingBox

class FaceDetectionInfo(BaseModel):
    box: BoundingBox
    confidence: float
    landmarks_count: int
    is_near_edge: bool = False
    edge_proximity: Optional[str] = None

class FrameAnalysisRequest(BaseModel):
    image_base64: str
    session_id: Optional[str] = None
    client_timestamp: Optional[float] = None

class FrameAnalysisResponse(BaseModel):
    face_count: int
    is_face_present: bool
    faces: List[FaceDetectionInfo] = []
    head_pose: Optional[HeadPoseResult] = None
    lighting: LightingQuality
    objects: List[DetectedObject] = []
    inference_latency_ms: float
    technical_warnings: List[str] = []
    model_version: str = "v1.2.0-mediapipe-hybrid"
    processed_at: float

