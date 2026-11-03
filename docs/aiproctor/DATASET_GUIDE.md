# Dataset Architecture & Annotation Protocol

## 1. Intended Use & Ethical Constraints
This dataset is designed strictly for detecting physical aids and peripheral screens during proctored examinations.
- **Prohibited Use:** Facial recognition, emotion classification, or automated disciplinary action.
- **Provenance:** Consented, staged examination laboratory sessions and synthetic environmental renders.

## 2. Directory Layout
```
ai/training/datasets/exam_objects/
├── images/
│   ├── train/  # 70% of candidate sessions
│   ├── val/    # 15% of candidate sessions
│   └── test/   # 15% of candidate sessions (untouched evaluation split)
└── labels/
    ├── train/
    ├── val/
    └── test/
```

## 3. Session Isolation Protocol
To prevent data leakage between adjacent video frames of the same individual:
- All frames for a given participant `p_XXX` belong **strictly** to one partition.
- `train_participants ∩ val_participants = ∅`
- `train_participants ∩ test_participants = ∅`
This guarantees that evaluation metrics reflect true generalization to unseen candidates.

## 4. Class Taxonomy & Permissibility Flags
| ID | Name | Default Policy | Justification |
| :--- | :--- | :--- | :--- |
| 0 | `cell_phone` | Prohibited | Communication & external search device |
| 1 | `book` | Configurable | Allowed during open-book exams |
| 2 | `paper_notes` | Configurable | Allowed if scratch paper authorized |
| 3 | `calculator` | Configurable | Permitted in math/engineering exams |
| 4 | `secondary_screen` | Prohibited | External screen / tablet mirror |

