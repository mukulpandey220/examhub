---
license: mit
tags:
- object-detection
- ai-proctoring
- computer-vision
- ultralytics
- yolov8
- pytorch
- onnx
pipeline_tag: object-detection
datasets:
- exam-objects-calibration
metrics:
- precision
- recall
- mAP_50
---

# AI-Proctor-YOLOv8-Exam-Detector: Real-Time Examination Object Detector

An open-source, lightweight computer vision detector trained to assist human invigilators by identifying potential secondary devices and prohibited study aids in online examination video streams.

## 1. Model Details
- **Architecture:** Fine-tuned YOLOv8 Nano (`yolov8n`)
- **Parameters:** 3.13 Million
- **Model Size:** 6.2 MB (PyTorch) / 12.2 MB (ONNX)
- **Target Platform:** Edge, Browser WebRTC, CPU/GPU, Apple Silicon MPS
- **License:** MIT Open Source

## 2. Target Classes
The model detects 5 key categories of examination environment items:
- **Class 0**: `cell_phone`
- **Class 1**: `book`
- **Class 2**: `paper_notes`
- **Class 3**: `calculator`
- **Class 4**: `secondary_screen`

## 3. Evaluation & Performance Metrics
Evaluated on an untouched partition with zero participant/session leakage:
- **Recall:** 95.0% (optimized to maximize capture of unauthorized items)
- **mAP@50:** 25.9%
- **Inference Speed:** 60.5 ms / frame on CPU (~16.5 FPS)

## 4. Ethical AI & Proctoring Policy
> [!IMPORTANT]
> This model provides **observational review signals to assist human invigilators**.
> Under institutional proctoring policy, model predictions are strictly advisory and must **never** be used to automatically accuse, penalize, or disqualify candidates without human review.

## 5. Usage Example (Python / Ultralytics)
```python
from ultralytics import YOLO

# Load model
model = YOLO("best.pt")

# Perform inference on webcam frame
results = model.predict(source="webcam_frame.jpg", conf=0.5)
for result in results:
    for box in result.boxes:
        print(f"Detected {model.names[int(box.cls)]} with confidence {float(box.conf):.2f}")
```
