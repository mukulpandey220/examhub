import os
os.environ["YOLO_CONFIG_DIR"] = "/tmp/Ultralytics"
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"

import sys
import json
import time
from typing import Dict, Any

def evaluate_model(
    weights_path: str = "/Users/srijan/aiproctor/ai/training/artifacts/exam_detector_run/weights/best.pt",
    config_path: str = "/Users/srijan/aiproctor/ai/training/configs/object_detection.yaml",
    output_report_path: str = "/Users/srijan/aiproctor/ai/training/artifacts/test_evaluation_report.json",
) -> Dict[str, Any]:
    print("==================================================================")
    print("Evaluating Trained Detector on Untouched Test Split")
    print(f"Weights: {weights_path}")
    print("==================================================================")

    if not os.path.exists(weights_path):
        # Fall back to base checkpoint if fine-tuned weights haven't been generated
        weights_path = "yolov8n.pt"
        print(f"Fine-tuned weights not found at path; evaluating baseline: {weights_path}")

    from ultralytics import YOLO

    model = YOLO(weights_path)
    t0 = time.time()

    # Run validation against the untouched test split
    metrics = model.val(
        data=config_path,
        split="test",
        project="/Users/srijan/aiproctor/ai/training/artifacts",
        name="val_run",
        exist_ok=True,
        verbose=True,
        save_json=False,
        plots=False,
    )

    eval_duration = round(time.time() - t0, 2)

    # Extract metrics dictionary
    map50 = float(metrics.box.map50) if hasattr(metrics.box, "map50") else 0.0
    map50_95 = float(metrics.box.map) if hasattr(metrics.box, "map") else 0.0
    precision = float(metrics.box.mp) if hasattr(metrics.box, "mp") else 0.0
    recall = float(metrics.box.mr) if hasattr(metrics.box, "mr") else 0.0
    speed_ms = metrics.speed if hasattr(metrics, "speed") else {"inference": 25.0}

    report = {
        "evaluation_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "tested_weights": weights_path,
        "dataset_split": "test (untouched partition)",
        "duration_sec": eval_duration,
        "metrics": {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "mAP_50": round(map50, 4),
            "mAP_50_95": round(map50_95, 4),
            "inference_speed_ms": speed_ms,
        },
        "classes": {
            0: "cell_phone",
            1: "book",
            2: "paper_notes",
            3: "calculator",
            4: "secondary_screen",
        },
        "non_accusatory_safeguard": "Review signals are advisory; prohibited from automated candidate penalties."
    }

    os.makedirs(os.path.dirname(output_report_path), exist_ok=True)
    with open(output_report_path, "w") as f:
        json.dump(report, f, indent=2)

    print("\nTest Split Evaluation Complete:")
    print(f"  Precision:   {precision * 100:.2f}%")
    print(f"  Recall:      {recall * 100:.2f}%")
    print(f"  mAP@50:      {map50 * 100:.2f}%")
    print(f"  mAP@50:95:   {map50_95 * 100:.2f}%")
    print(f"  Inference:   {speed_ms.get('inference', 0):.2f} ms / frame")
    print(f"\nReport exported to: {output_report_path}")
    print("==================================================================")
    return report

if __name__ == "__main__":
    evaluate_model()
