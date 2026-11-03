import os
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"

import pytest
import numpy as np
from app.detectors.lighting_analyzer import LightingAnalyzer
from app.detectors.head_pose import HeadPoseEstimator
from app.detectors.edge_guard import ViewportEdgeGuard
from app.detectors.temporal_filter import AdaptiveEMAFilter, HeadPoseSmoother
from app.detectors.gaze_estimator import GazeEstimator
from app.core.types import BoundingBox
from app.engine.analyzer import ProctoringAnalyzer
from app.evaluation.benchmark import create_synthetic_face_canvas

def test_lighting_analyzer_adequate():
    analyzer = LightingAnalyzer(min_luminance=35.0, max_luminance=225.0)
    # Image with realistic contrast (mean ~128, std > 15)
    img = np.full((100, 100, 3), 128, dtype=np.uint8)
    img[25:75, 25:75] = 180
    quality = analyzer.analyze(img)
    assert quality.status == "adequate"
    assert not quality.is_compromised
    assert 130.0 <= quality.mean_luminance <= 150.0

def test_lighting_analyzer_underexposed():
    analyzer = LightingAnalyzer(min_luminance=35.0, max_luminance=225.0)
    dark_img = np.full((100, 100, 3), 20, dtype=np.uint8)
    quality = analyzer.analyze(dark_img)
    assert quality.status == "underexposed"
    assert quality.is_compromised

def test_lighting_analyzer_overexposed():
    analyzer = LightingAnalyzer(min_luminance=35.0, max_luminance=225.0)
    bright_img = np.full((100, 100, 3), 245, dtype=np.uint8)
    quality = analyzer.analyze(bright_img)
    assert quality.status == "overexposed"
    assert quality.is_compromised

def test_head_pose_frontal():
    estimator = HeadPoseEstimator(max_yaw=25.0, max_pitch=20.0)
    frontal_pts = np.array([
        (320.0, 240.0),  # Nose
        (320.0, 310.0),  # Chin
        (280.0, 215.0),  # Left eye
        (360.0, 215.0),  # Right eye
        (295.0, 280.0),  # Left mouth
        (345.0, 280.0),  # Right mouth
    ])
    res = estimator.estimate((480, 640, 3), frontal_pts)
    assert res is not None
    assert abs(res.yaw) < 25.0
    assert not res.is_deviated

def test_head_pose_yaw_deviation():
    estimator = HeadPoseEstimator(max_yaw=25.0, max_pitch=20.0)
    # Exaggerated nose shift right
    right_pts = np.array([
        (355.0, 240.0),  # Nose shifted right
        (340.0, 310.0),  # Chin shifted right
        (295.0, 215.0),  # Left eye
        (375.0, 215.0),  # Right eye
        (315.0, 280.0),  # Left mouth
        (360.0, 280.0),  # Right mouth
    ])
    res = estimator.estimate((480, 640, 3), right_pts)
    assert res is not None
    assert res.is_deviated
    assert res.deviation_direction in ["right", "left"]

def test_analyzer_on_canvas():
    analyzer = ProctoringAnalyzer()
    canvas = create_synthetic_face_canvas(width=320, height=240, draw_face=False)
    resp = analyzer.analyze_frame(canvas)
    assert resp is not None
    assert resp.inference_latency_ms > 0
    assert isinstance(resp.technical_warnings, list)

def test_viewport_edge_guard():
    guard = ViewportEdgeGuard(edge_margin_percent=0.05)
    # Box touching left edge (x=10 on 640 width is <= 32)
    near_left_box = BoundingBox(x=10.0, y=100.0, width=150.0, height=180.0)
    is_near, edge = guard.check_edge_proximity(near_left_box, (480, 640, 3))
    assert is_near is True
    assert edge == "left"

    # Box centered
    centered_box = BoundingBox(x=240.0, y=150.0, width=160.0, height=180.0)
    is_near, edge = guard.check_edge_proximity(centered_box, (480, 640, 3))
    assert is_near is False
    assert edge is None

    # Clamping out-of-bounds coordinates
    clamped = guard.clamp_and_refine_box(-20.0, -10.0, 700.0, 500.0, (480, 640, 3))
    assert clamped.x == 0.0
    assert clamped.y == 0.0
    assert clamped.width == 640.0
    assert clamped.height == 480.0

def test_temporal_smoother():
    smoother = HeadPoseSmoother()
    # Rapid noise fluctuations around 20.0
    s1 = smoother.smooth(20.0, 5.0, 0.0, timestamp=1.0)
    s2 = smoother.smooth(24.0, 5.0, 0.0, timestamp=1.05)
    # The smoothed yaw should dampen the spike from 24.0
    assert s2[0] < 24.0
    assert s2[0] > 20.0

def test_gaze_estimator_fallback():
    estimator = GazeEstimator()
    dummy_pts = np.zeros((478, 2), dtype=np.float64)
    # Configure eye corners and centered irises
    dummy_pts[33] = [280, 215]   # left outer
    dummy_pts[133] = [320, 215]  # left inner
    dummy_pts[468] = [300, 215]  # left iris center (halfway)

    dummy_pts[362] = [360, 215]  # right inner
    dummy_pts[263] = [400, 215]  # right outer
    dummy_pts[473] = [380, 215]  # right iris center (halfway)

    dummy_pts[159] = [300, 205]  # left upper
    dummy_pts[145] = [300, 225]  # left lower
    dummy_pts[386] = [380, 205]  # right upper
    dummy_pts[374] = [380, 225]  # right lower

    gaze = estimator.estimate_gaze(dummy_pts, (480, 640, 3))
    assert gaze["gaze_direction"] == "centered"
    assert gaze["is_gaze_deviated"] is False
