import time
import numpy as np
from typing import Optional, Tuple, Dict, Any

class AdaptiveEMAFilter:
    """
    Adaptive Exponential Moving Average (EMA) filter with velocity scaling.
    Smooths high-frequency jitter when the signal is relatively still,
    while dynamically relaxing smoothing during rapid movements to maintain responsiveness.
    """
    def __init__(
        self,
        min_alpha: float = 0.25,
        max_alpha: float = 0.85,
        velocity_threshold: float = 15.0,
    ):
        self.min_alpha = min_alpha
        self.max_alpha = max_alpha
        self.velocity_threshold = velocity_threshold
        self.last_value: Optional[float] = None
        self.last_time: Optional[float] = None

    def filter(self, current_value: float, timestamp: Optional[float] = None) -> float:
        now = timestamp if timestamp is not None else time.time()

        if self.last_value is None or self.last_time is None:
            self.last_value = current_value
            self.last_time = now
            return current_value

        dt = max(now - self.last_time, 1e-4)
        velocity = abs(current_value - self.last_value) / dt

        # Adaptive alpha: interpolate between min_alpha and max_alpha based on velocity
        velocity_ratio = min(1.0, velocity / self.velocity_threshold)
        alpha = self.min_alpha + (self.max_alpha - self.min_alpha) * velocity_ratio

        smoothed = alpha * current_value + (1.0 - alpha) * self.last_value
        self.last_value = smoothed
        self.last_time = now
        return smoothed

    def reset(self):
        self.last_value = None
        self.last_time = None


class HeadPoseSmoother:
    """
    Stabilizes yaw, pitch, and roll Euler angles to prevent jittery
    transitions around deviation thresholds.
    """
    def __init__(self):
        self.yaw_filter = AdaptiveEMAFilter(min_alpha=0.30, max_alpha=0.85, velocity_threshold=20.0)
        self.pitch_filter = AdaptiveEMAFilter(min_alpha=0.30, max_alpha=0.85, velocity_threshold=20.0)
        self.roll_filter = AdaptiveEMAFilter(min_alpha=0.30, max_alpha=0.85, velocity_threshold=20.0)

    def smooth(
        self,
        yaw: float,
        pitch: float,
        roll: float,
        timestamp: Optional[float] = None
    ) -> Tuple[float, float, float]:
        smoothed_yaw = self.yaw_filter.filter(yaw, timestamp)
        smoothed_pitch = self.pitch_filter.filter(pitch, timestamp)
        smoothed_roll = self.roll_filter.filter(roll, timestamp)
        return (
            round(smoothed_yaw, 2),
            round(smoothed_pitch, 2),
            round(smoothed_roll, 2),
        )

    def reset(self):
        self.yaw_filter.reset()
        self.pitch_filter.reset()
        self.roll_filter.reset()

