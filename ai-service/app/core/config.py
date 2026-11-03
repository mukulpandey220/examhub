import os
from pydantic import BaseModel

class VisionSettings(BaseModel):
    # Head pose threshold in degrees
    max_yaw_angle_deg: float = float(os.getenv("MAX_YAW_ANGLE_DEG", "25.0"))
    max_pitch_angle_deg: float = float(os.getenv("MAX_PITCH_ANGLE_DEG", "20.0"))
    
    # Lighting thresholds (0-255 scale)
    min_luminance_threshold: float = float(os.getenv("MIN_LUMINANCE", "35.0"))
    max_luminance_threshold: float = float(os.getenv("MAX_LUMINANCE", "225.0"))
    
    # Model confidence thresholds
    min_face_detection_confidence: float = float(os.getenv("MIN_FACE_CONFIDENCE", "0.5"))
    multi_face_confidence_threshold: float = float(os.getenv("MULTI_FACE_CONFIDENCE", "0.6"))
    object_detection_confidence: float = float(os.getenv("OBJECT_CONFIDENCE", "0.35"))
    
    # Processing bounds
    max_image_dimension: int = 1280

settings = VisionSettings()

