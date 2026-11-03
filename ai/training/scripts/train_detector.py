import os
os.environ["YOLO_CONFIG_DIR"] = "/tmp/Ultralytics"
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"

import sys
import time
import yaml
from pathlib import Path
from model_registry import registry

def select_optimal_device() -> str:
    """Detects available hardware acceleration with safe fallbacks."""
    try:
        import torch
        if torch.cuda.is_available():
            print("🚀 NVIDIA CUDA GPU detected.")
            return "0"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            print("⚡ Apple Silicon Metal Performance Shaders (MPS) accelerator detected.")
            return "mps"
    except Exception as e:
        print(f"Hardware check note: {e}")
    print("🖥️ Using CPU execution.")
    return "cpu"

def train_object_detector(
    config_path: str = "/Users/srijan/aiproctor/ai/training/configs/object_detection.yaml",
    base_model: str = "/Users/srijan/aiproctor/ai/training/artifacts/yolov8n.pt",
    output_dir: str = "/Users/srijan/aiproctor/ai/training/artifacts",
    epochs: int = 2,
    batch_size: int = 4,
    img_size: int = 640,
) -> str:
    print("==================================================================")
    print("Starting AI Proctor Object Detector Fine-Tuning Pipeline")
    print("==================================================================")

    # 1. Load config
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config YAML not found: {config_path}")
    with open(config_path, "r") as f:
        cfg = yaml.safe_load(f)

    device = select_optimal_device()
    os.makedirs(output_dir, exist_ok=True)

    start_time = time.time()

    # 2. Train via Ultralytics YOLO
    try:
        from ultralytics import YOLO
        print(f"Loading base checkpoint: {base_model}...")
        model = YOLO(base_model)

        print(f"Executing training loop (epochs={epochs}, batch={batch_size}, imgsz={img_size}, device={device})...")
        results = model.train(
            data=config_path,
            epochs=epochs,
            batch=batch_size,
            imgsz=img_size,
            device=device,
            project=output_dir,
            name="exam_detector_run",
            exist_ok=True,
            verbose=True,
            save=True,
            plots=False,
        )

        train_duration = round(time.time() - start_time, 2)
        print(f"\nTraining completed in {train_duration} seconds.")

        # Path to best trained weights
        best_pt_path = os.path.join(output_dir, "exam_detector_run", "weights", "best.pt")
        if not os.path.exists(best_pt_path):
            best_pt_path = os.path.join(output_dir, "exam_detector_run", "weights", "last.pt")

        # Extract metrics
        metrics = {
            "train_duration_sec": train_duration,
            "device": device,
            "epochs": epochs,
            "batch_size": batch_size,
            "img_size": img_size,
        }

        # Register model version
        version = f"v1.0.{int(time.time()) % 1000}"
        registered = registry.register_model(
            model_identifier="yolo-exam-detector",
            version=version,
            dataset_version="exam-objects-v1.0",
            artifact_path=best_pt_path,
            training_config={"base_model": base_model, "epochs": epochs, "device": device},
            evaluation_metrics=metrics,
            is_active=True,
        )

        print(f"✅ Model registered in Registry: {registered['model_identifier']} ({registered['version']})")
        print(f"Artifact Checksum (SHA256): {registered['artifact_checksum']}")
        return best_pt_path

    except ImportError:
        print("Ultralytics / PyTorch is not available. Please verify virtual environment.")
        raise

if __name__ == "__main__":
    trained_path = train_object_detector()
    print(f"Trained model artifact saved at: {trained_path}")
