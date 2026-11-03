import os
import cv2
import sys
from typing import Dict, Set, List, Tuple

def validate_dataset(dataset_dir: str = "/Users/srijan/aiproctor/ai/training/datasets/exam_objects") -> bool:
    print("==================================================================")
    print(f"Validating Dataset Integrity at: {dataset_dir}")
    print("==================================================================")

    splits = ["train", "val", "test"]
    expected_classes = {0, 1, 2, 3, 4}
    class_names = {
        0: "cell_phone",
        1: "book",
        2: "paper_notes",
        3: "calculator",
        4: "secondary_screen",
    }

    split_participants: Dict[str, Set[str]] = {s: set() for s in splits}
    class_counts: Dict[str, Dict[int, int]] = {s: {cid: 0 for cid in expected_classes} for s in splits}
    total_images = 0
    total_annotations = 0
    validation_passed = True
    errors = []

    for split in splits:
        img_dir = os.path.join(dataset_dir, "images", split)
        lbl_dir = os.path.join(dataset_dir, "labels", split)

        if not os.path.isdir(img_dir):
            errors.append(f"Missing images directory for split '{split}': {img_dir}")
            validation_passed = False
            continue
        if not os.path.isdir(lbl_dir):
            errors.append(f"Missing labels directory for split '{split}': {lbl_dir}")
            validation_passed = False
            continue

        image_files = [f for f in os.listdir(img_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        if len(image_files) == 0:
            errors.append(f"Split '{split}' has 0 valid image files.")
            validation_passed = False
            continue

        for img_name in image_files:
            total_images += 1
            img_path = os.path.join(img_dir, img_name)
            base_name = os.path.splitext(img_name)[0]
            lbl_path = os.path.join(lbl_dir, f"{base_name}.txt")

            # Extract subject ID (e.g., p_001 from p_001_frame_000)
            parts = base_name.split("_")
            if len(parts) >= 2:
                participant_id = f"{parts[0]}_{parts[1]}"
                split_participants[split].add(participant_id)

            # 1. Verify image can be decoded
            img = cv2.imread(img_path)
            if img is None:
                errors.append(f"Corrupt or undecodable image file: {img_path}")
                validation_passed = False
                continue

            h, w = img.shape[:2]
            if h < 32 or w < 32:
                errors.append(f"Image {img_path} resolution is invalid: {w}x{h}")
                validation_passed = False

            # 2. Verify matching label exists
            if not os.path.exists(lbl_path):
                # Empty background image without annotations is permitted in YOLO
                continue

            # 3. Validate bounding box coordinates and class IDs
            with open(lbl_path, "r") as lf:
                for line_idx, line in enumerate(lf):
                    line = line.strip()
                    if not line:
                        continue
                    tokens = line.split()
                    if len(tokens) != 5:
                        errors.append(f"{lbl_path}:{line_idx + 1} invalid YOLO token count ({len(tokens)} != 5)")
                        validation_passed = False
                        continue

                    try:
                        cid = int(tokens[0])
                        cx, cy, nw, nh = map(float, tokens[1:])
                    except ValueError:
                        errors.append(f"{lbl_path}:{line_idx + 1} numeric conversion failure: {line}")
                        validation_passed = False
                        continue

                    if cid not in expected_classes:
                        errors.append(f"{lbl_path}:{line_idx + 1} Class ID {cid} is out of expected range [0-4]")
                        validation_passed = False
                    else:
                        class_counts[split][cid] += 1
                        total_annotations += 1

                    # Check bounding box normalization [0, 1]
                    if not (0.0 <= cx <= 1.0 and 0.0 <= cy <= 1.0 and 0.0 < nw <= 1.0 and 0.0 < nh <= 1.0):
                        errors.append(f"{lbl_path}:{line_idx + 1} Bounding box coordinates out of [0, 1] bounds")
                        validation_passed = False

    # 4. Check for participant leakage between splits (Section 6 Requirement)
    train_parts = split_participants["train"]
    val_parts = split_participants["val"]
    test_parts = split_participants["test"]

    train_val_leak = train_parts.intersection(val_parts)
    train_test_leak = train_parts.intersection(test_parts)
    val_test_leak = val_parts.intersection(test_parts)

    if train_val_leak:
        errors.append(f"Session Leakage detected between train and val: {train_val_leak}")
        validation_passed = False
    if train_test_leak:
        errors.append(f"Session Leakage detected between train and test: {train_test_leak}")
        validation_passed = False
    if val_test_leak:
        errors.append(f"Session Leakage detected between val and test: {val_test_leak}")
        validation_passed = False

    # Report Summary
    print(f"\nTotal Verified Images: {total_images}")
    print(f"Total Bounding Boxes: {total_annotations}")
    print(f"Session Isolation:")
    print(f"  Train Participants: {sorted(list(train_parts))}")
    print(f"  Val Participants:   {sorted(list(val_parts))}")
    print(f"  Test Participants:  {sorted(list(test_parts))}")

    print("\nClass Distribution by Split:")
    print(f"{'Class ID':<10} {'Class Name':<18} {'Train':<10} {'Val':<10} {'Test':<10} {'Total':<10}")
    print("-" * 68)
    for cid in sorted(expected_classes):
        tr = class_counts["train"][cid]
        va = class_counts["val"][cid]
        te = class_counts["test"][cid]
        tot = tr + va + te
        print(f"{cid:<10} {class_names[cid]:<18} {tr:<10} {va:<10} {te:<10} {tot:<10}")

    if not validation_passed:
        print("\n❌ Dataset Validation FAILED with the following errors:")
        for err in errors[:10]:
            print(f"  - {err}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more errors.")
        return False

    print("\n✅ Dataset Validation PASSED with 100% integrity and zero session leakage.")
    print("==================================================================")
    return True

if __name__ == "__main__":
    success = validate_dataset()
    sys.exit(0 if success else 1)

