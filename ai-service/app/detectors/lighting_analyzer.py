import cv2
import numpy as np
from app.core.config import settings
from app.core.types import LightingQuality

class LightingAnalyzer:
    """
    Evaluates frame luminance and contrast. Prevents false cheating accusations
    caused by inadequate ambient illumination or sensor overexposure.
    """
    def __init__(
        self,
        min_luminance: float = settings.min_luminance_threshold,
        max_luminance: float = settings.max_luminance_threshold,
    ):
        self.min_luminance = min_luminance
        self.max_luminance = max_luminance

    def analyze(self, frame_bgr: np.ndarray) -> LightingQuality:
        # Convert to grayscale
        if len(frame_bgr.shape) == 3:
            gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        else:
            gray = frame_bgr

        mean_lum = float(np.mean(gray))
        contrast = float(np.std(gray))

        # Edge Sharpness via Laplacian Variance (detects camera lens blur / occlusion)
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        is_blurred = laplacian_var < 30.0

        if mean_lum < self.min_luminance:
            status = "underexposed"
            is_compromised = True
        elif mean_lum > self.max_luminance:
            status = "overexposed"
            is_compromised = True
        elif contrast < 15.0:
            status = "low_contrast"
            is_compromised = True
        elif is_blurred:
            status = "blurred"
            is_compromised = True
        else:
            status = "adequate"
            is_compromised = False

        return LightingQuality(
            mean_luminance=round(mean_lum, 2),
            contrast_rms=round(contrast, 2),
            status=status,
            is_compromised=is_compromised,
            sharpness_score=round(laplacian_var, 2),
            is_blurred=is_blurred,
        )

