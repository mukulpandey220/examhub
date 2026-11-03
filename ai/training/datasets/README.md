# AI Proctor Object Detection Dataset Guide

## 1. Dataset Taxonomy & Configurable Classes

The object detection module focuses on identifying items that may require invigilator review during an examination:

| Class ID | Class Label | Permissibility Policy | Description |
| :--- | :--- | :--- | :--- |
| `0` | `cell_phone` | Prohibited | Smartphones, handheld cellular devices, or mobile screens |
| `1` | `book` | Configurable | Bound textbook, reference manual, or catalog |
| `2` | `paper_notes` | Configurable | Handwritten sheets, printed index cards, or cheat sheets |
| `3` | `calculator` | Configurable | Scientific or graphing handheld calculator |
| `4` | `secondary_screen` | Prohibited | Auxiliary monitor, iPad/tablet, or secondary laptop screen |

> [!IMPORTANT]
> **Permissibility is context-dependent:** If an open-book exam authorizes physical calculators or textbooks, the exam configuration flag sets `allowed_materials: ["calculator", "book"]`. The AI will still detect and log the object, but the Rule Engine suppresses disciplinary alert escalation.

## 2. Dataset Provenance & Data Splitting Protocol

- **Session-Grouped Splitting:** To avoid frame correlation leakage, frames from the same candidate/recording session are placed exclusively within either `train`, `val`, or `test`.
- **Target Distribution:** 70% Train, 15% Validation, 15% Test.
- **Label Format:** Standard normalized YOLO format `(class_id center_x center_y width height)`.

