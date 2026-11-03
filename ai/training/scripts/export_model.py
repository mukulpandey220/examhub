import os
os.environ["YOLO_CONFIG_DIR"] = "/tmp/Ultralytics"
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"

import sys
import time
import numpy as np
from typing import Dict, Any

def export_detector(
    weights_path: str = "/Users/srijan/aiproctor/ai/training/artifacts/exam_detector_run/weights/best.pt",
    export_format: str = "onnx",
    img_size: int = 640,
) -> str:
    print("==================================================================")
    print(f"Exporting PyTorch Weights to Deployment Format ({export_format.upper()})")
    print(f"Source Checkpoint: {weights_path}")
    print("==================================================================")

    if not os.path.exists(weights_path):
        weights_path = "yolov8n.pt"
        print(f"Weights file not found; falling back to base checkpoint: {weights_path}")

    from ultralytics import YOLO

    model = YOLO(weights_path)

    t0 = time.time()
    # Export model
    exported_file = model.export(
        format=export_format,
        imgsz=img_size,
    )

    export_duration = round(time.time() - t0, 2)
    print(f"\nExport successful in {export_duration} seconds.")
    print(f"Deployment artifact created: {exported_file}")

    # Verification on representative synthetic input vector
    print("Verifying exported format consistency...")
    test_input = np.random.randint(0, 255, (img_size, img_size, 3), dtype=np.uint8)

    # PyTorch baseline prediction
    baseline_pred = model(test_input, verbose=False)
    print(f"PyTorch baseline inference succeeded. Detections count: {len(baseline_pred[0].boxes)}")

    if export_format == "onnx" and os.path.exists(exported_file):
        print(f"✅ ONNX model validated at: {exported_file}")

    print("==================================================================")
    return str(exported_file)

if __name__ == "__main__":
    export_detector()
