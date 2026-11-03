# Custom AI Model Training & Lifecycle Guide

This guide documents the complete, reproducible training, validation, evaluation, export, registration, and rollback workflow for the custom YOLO exam object detector.

---

## 1. Creating the Python Environment
```bash
cd /Users/srijan/aiproctor/ai-service
python3 -m venv venv
source venv/bin/activate
```

## 2. Installing Compatible Dependencies
```bash
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
./venv/bin/pip install torch torchvision ultralytics pyyaml onnx
```

---

## 3. Dataset Preparation & Legal Provenance
The detector identifies 5 exam-relevant object classes:
- `0: cell_phone` (prohibited device)
- `1: book` (permitted only if open-book exam)
- `2: paper_notes` (permitted only if formula sheet authorized)
- `3: calculator` (permitted in quantitative exams)
- `4: secondary_screen` (auxiliary monitor/tablet)

To generate the calibrated baseline dataset (with zero session leakage across train, val, and test partitions):
```bash
./venv/bin/python ai/training/scripts/build_calibration_dataset.py
```
Expected output:
```
Building Exam Object Detection Dataset at .../datasets/exam_objects...
Dataset generation complete. Total Images: 80
  Class 0 (cell_phone      ): 22 instances
  Class 1 (book            ): 13 instances
  Class 2 (paper_notes     ): 21 instances
  Class 3 (calculator      ): 24 instances
  Class 4 (secondary_screen): 25 instances
```

---

## 4. Annotating Custom Images (YOLO Format)
Each image file (e.g., `p_001_frame_000.jpg`) must have a corresponding `.txt` file in `labels/` with lines formatted as:
```
<class_id> <center_x> <center_y> <width> <height>
```
All coordinates are normalized floats in the range $[0.0, 1.0]$.

---

## 5. Validating Dataset Integrity
Run the automated dataset validator before launching any training job:
```bash
./venv/bin/python ai/training/scripts/validate_dataset.py
```
This script checks:
- Image decoding and min resolution ($\ge 32\times 32$)
- Bounding box normalization ($0 \le x, y, w, h \le 1$)
- Class IDs within range $[0-4]$
- **Zero Session Leakage:** Verifies that candidate IDs in `train` do not overlap with `val` or `test`.

---

## 6. Training the First Model
Execute the training pipeline:
```bash
./venv/bin/python ai/training/scripts/train_detector.py
```
- Hardware is automatically detected: Apple Silicon MPS, NVIDIA CUDA, or CPU fallback.
- Weights are saved to: `ai/training/artifacts/exam_detector_run/weights/best.pt`.
- The trained model is automatically hashed (SHA256) and registered into `ai/training/artifacts/model_registry.json`.

---

## 7. Resuming or Repeating Training
To resume from a checkpoint:
```bash
yolo train resume model=ai/training/artifacts/exam_detector_run/weights/last.pt
```
Or specify higher epochs in `ai/training/configs/object_detection.yaml`:
```yaml
epochs: 15
batch: 8
imgsz: 640
```

---

## 8. Evaluating on the Untouched Test Set
Evaluate the best checkpoint against the untouched test split:
```bash
./venv/bin/python ai/training/scripts/evaluate_detector.py
```
Outputs precision, recall, mAP@50, mAP@50:95, and per-frame latency in:
`ai/training/artifacts/test_evaluation_report.json`.

---

## 9. Inspecting False Positives & False Negatives
Inspect low-confidence detections and ground truth differences in the validation artifact folder:
```bash
ls -la ai/training/artifacts/val_run/
```

---

## 10. Exporting to Deployment Formats
Export PyTorch weights to ONNX and TorchScript:
```bash
./venv/bin/python ai/training/scripts/export_model.py
```
Outputs:
- ONNX: `ai/training/artifacts/exam_detector_run/weights/best.onnx`
- TorchScript: `ai/training/artifacts/exam_detector_run/weights/best.torchscript`

---

## 11. Registering & Deploying a Model Version
View registered models in the registry:
```bash
./venv/bin/python ai/training/scripts/model_registry.py
```
To query registered models via REST:
```bash
curl http://localhost:8000/models
```

---

## 12. Rolling Back to a Previous Model Version
In `ai/training/scripts/model_registry.py`, run:
```python
from model_registry import registry
registry.rollback_model("yolo-exam-detector", "v1.0.524")
```
This re-activates the specified target version without modifying codebase logic or creating service downtime.

