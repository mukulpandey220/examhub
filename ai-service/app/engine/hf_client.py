import os
import io
import time
from typing import List, Dict, Any, Optional
from PIL import Image

try:
    from huggingface_hub import InferenceClient
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False

class HuggingFaceInferenceClient:
    """
    Client for Hugging Face's free open-source Serverless Inference API.
    Can be used for secondary verification or cloud zero-shot object detection.
    """
    def __init__(self, model_id: str = "facebook/detr-resnet-50", token: Optional[str] = None):
        self.model_id = model_id
        self.token = token or os.environ.get("HF_TOKEN")
        self.client = None
        if HF_AVAILABLE:
            try:
                self.client = InferenceClient(model=self.model_id, token=self.token)
            except Exception as e:
                print(f"HF InferenceClient init note: {e}")

    def is_available(self) -> bool:
        return self.client is not None

    def detect_objects(self, image_bytes: bytes, threshold: float = 0.5) -> List[Dict[str, Any]]:
        """
        Sends an image to Hugging Face Serverless Inference API for object detection.
        Returns normalized bounding boxes and detected labels.
        """
        if not self.client:
            return []

        try:
            t0 = time.perf_counter()
            # Hugging Face object-detection returns a list of dictionaries with 'score', 'label', 'box'
            response = self.client.object_detection(image_bytes)
            latency_ms = (time.perf_counter() - t0) * 1000.0

            results = []
            for item in response:
                score = item.get("score", 0.0)
                if score >= threshold:
                    box = item.get("box", {})
                    # Standardize format
                    results.append({
                        "label": item.get("label", "unknown"),
                        "confidence": round(score, 3),
                        "box": {
                            "xmin": box.get("xmin", 0),
                            "ymin": box.get("ymin", 0),
                            "xmax": box.get("xmax", 0),
                            "ymax": box.get("ymax", 0),
                        },
                        "source": "huggingface-serverless-api",
                        "latency_ms": round(latency_ms, 1),
                    })
            return results
        except Exception as e:
            # Degrade gracefully on network interruptions or rate limits
            print(f"Hugging Face serverless inference notice: {e}")
            return []

# Shared instance for secondary object verification
hf_inference_client = HuggingFaceInferenceClient()

