import os
from pydantic import BaseModel

class InferenceConfig(BaseModel):
    service_name: str = "ai-proctor-inference"
    version: str = "v1.2.0"
    api_key: str = os.getenv("AI_SERVICE_API_KEY", "proctor-internal-ai-key-2026")
    max_request_bytes: int = 15 * 1024 * 1024  # 15 MB
    request_timeout_sec: float = 8.0
    max_batch_size: int = 8
    models_dir: str = "/Users/srijan/aiproctor/ai-service/models"

settings = InferenceConfig()

