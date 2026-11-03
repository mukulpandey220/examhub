import os
import cv2
import numpy as np
import random
from typing import List, Tuple, Dict

CLASSES = {
    0: "cell_phone",
    1: "book",
    2: "paper_notes",
    3: "calculator",
    4: "secondary_screen",
}

def draw_cell_phone(img: np.ndarray, x: int, y: int, w: int, h: int):
    # Black/dark gray rounded chassis
    cv2.rectangle(img, (x, y), (x + w, y + h), (30, 30, 30), -1)
    cv2.rectangle(img, (x, y), (x + w, y + h), (70, 70, 70), 2)
    # Glossy screen interior
    sx, sy, sw, sh = x + 3, y + 6, w - 6, h - 12
    cv2.rectangle(img, (sx, sy), (sx + sw, sy + sh), (10, 10, 15), -1)
    # Screen notch / speaker
    cv2.line(img, (x + w // 2 - 4, y + 3), (x + w // 2 + 4, y + 3), (120, 120, 120), 1)

def draw_book(img: np.ndarray, x: int, y: int, w: int, h: int):
    # Book cover
    cv2.rectangle(img, (x, y), (x + w, y + h), (140, 40, 40), -1)
    cv2.rectangle(img, (x, y), (x + w, y + h), (180, 60, 60), 2)
    # Spine and page thickness
    cv2.rectangle(img, (x + w - 8, y + 2), (x + w - 2, y + h - 2), (230, 230, 220), -1)
    # Title embossing line
    cv2.line(img, (x + 10, y + h // 2), (x + w - 15, y + h // 2), (220, 180, 50), 2)

def draw_paper_notes(img: np.ndarray, x: int, y: int, w: int, h: int):
    # White paper sheet
    cv2.rectangle(img, (x, y), (x + w, y + h), (245, 245, 245), -1)
    cv2.rectangle(img, (x, y), (x + w, y + h), (180, 180, 180), 1)
    # Ruled notes lines
    for line_y in range(y + 8, y + h - 6, 8):
        cv2.line(img, (x + 6, line_y), (x + w - 6, line_y), (180, 200, 230), 1)

def draw_calculator(img: np.ndarray, x: int, y: int, w: int, h: int):
    # Gray body
    cv2.rectangle(img, (x, y), (x + w, y + h), (60, 65, 70), -1)
    cv2.rectangle(img, (x, y), (x + w, y + h), (100, 105, 110), 2)
    # LCD display on top
    cv2.rectangle(img, (x + 4, y + 4), (x + w - 4, y + int(h * 0.25)), (160, 175, 150), -1)
    # Keypad grid buttons
    btn_start_y = y + int(h * 0.32)
    for r in range(4):
        for c in range(3):
            bx = x + 4 + c * (w // 3)
            by = btn_start_y + r * 10
            if by + 7 < y + h - 2:
                cv2.rectangle(img, (bx, by), (bx + (w // 3) - 3, by + 7), (35, 35, 40), -1)

def draw_secondary_screen(img: np.ndarray, x: int, y: int, w: int, h: int):
    # Thin bezel tablet / monitor
    cv2.rectangle(img, (x, y), (x + w, y + h), (20, 20, 25), -1)
    cv2.rectangle(img, (x, y), (x + w, y + h), (90, 90, 95), 2)
    # Active lit display
    cv2.rectangle(img, (x + 4, y + 4), (x + w - 4, y + h - 4), (200, 220, 240), -1)
    # Graphical window bar
    cv2.rectangle(img, (x + 4, y + 4), (x + w - 4, y + 14), (50, 90, 160), -1)

RENDERERS = {
    0: (draw_cell_phone, (35, 70)),        # w, h
    1: (draw_book, (90, 110)),
    2: (draw_paper_notes, (70, 85)),
    3: (draw_calculator, (50, 80)),
    4: (draw_secondary_screen, (130, 90)),
}

def generate_sample_image(
    canvas_w: int = 640,
    canvas_h: int = 480,
    background_lum: int = 140,
    placed_classes: List[int] = None,
) -> Tuple[np.ndarray, List[Tuple[int, float, float, float, float]]]:
    """
    Renders background desk texture, candidate silhouette, and exam objects.
    Returns: (image_bgr, yolo_labels) where each label is (class_id, x_center, y_center, w, h)
    """
    # 1. Base desk/room canvas with subtle noise
    canvas = np.full((canvas_h, canvas_w, 3), background_lum, dtype=np.uint8)
    noise = np.random.normal(0, 4, (canvas_h, canvas_w, 3)).astype(np.int16)
    canvas = np.clip(canvas.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    # 2. Candidate head/shoulder silhouette (seated at desk)
    cv2.ellipse(canvas, (320, 200), (60, 75), 0, 0, 360, (190, 180, 175), -1)
    cv2.ellipse(canvas, (320, 340), (120, 70), 0, 0, 360, (70, 80, 95), -1)

    labels = []
    if placed_classes is None:
        placed_classes = []

    # Safe placement regions avoiding direct center of head
    placement_slots = [
        (80, 300),   # Desk bottom-left
        (460, 310),  # Desk bottom-right
        (100, 180),  # Mid-left
        (480, 180),  # Mid-right
        (220, 380),  # Bottom keyboard area
    ]
    random.shuffle(placement_slots)

    for i, cls_id in enumerate(placed_classes):
        if i >= len(placement_slots):
            break
        drawer, (default_w, default_h) = RENDERERS[cls_id]
        scale = random.uniform(0.85, 1.15)
        obj_w = int(default_w * scale)
        obj_h = int(default_h * scale)

        slot_x, slot_y = placement_slots[i]
        obj_x = max(10, min(canvas_w - obj_w - 10, slot_x + random.randint(-15, 15)))
        obj_y = max(10, min(canvas_h - obj_h - 10, slot_y + random.randint(-15, 15)))

        # Draw object on canvas
        drawer(canvas, obj_x, obj_y, obj_w, obj_h)

        # Normalize coordinates to YOLO format: center_x, center_y, width, height (0.0 to 1.0)
        cx = (obj_x + obj_w / 2.0) / canvas_w
        cy = (obj_y + obj_h / 2.0) / canvas_h
        norm_w = obj_w / canvas_w
        norm_h = obj_h / canvas_h

        labels.append((cls_id, round(cx, 5), round(cy, 5), round(norm_w, 5), round(norm_h, 5)))

    return canvas, labels

def build_dataset(base_dir: str = "/Users/srijan/aiproctor/ai/training/datasets/exam_objects"):
    print(f"Building Exam Object Detection Dataset at {base_dir}...")
    random.seed(42)
    np.random.seed(42)

    # 10 synthetic participant sessions
    # 70% Train (Participants 1-7)
    # 15% Val   (Participants 8)
    # 15% Test  (Participants 9-10)
    splits = {
        "train": ["p_001", "p_002", "p_003", "p_004", "p_005", "p_006", "p_007"],
        "val": ["p_008"],
        "test": ["p_009", "p_010"],
    }

    # Samples per participant
    samples_per_participant = 8

    total_images = 0
    total_objects = {cls_id: 0 for cls_id in CLASSES}

    for split_name, participants in splits.items():
        img_dir = os.path.join(base_dir, "images", split_name)
        lbl_dir = os.path.join(base_dir, "labels", split_name)
        os.makedirs(img_dir, exist_ok=True)
        os.makedirs(lbl_dir, exist_ok=True)

        for p_id in participants:
            for s_idx in range(samples_per_participant):
                filename = f"{p_id}_frame_{s_idx:03d}"
                img_path = os.path.join(img_dir, f"{filename}.jpg")
                lbl_path = os.path.join(lbl_dir, f"{filename}.txt")

                # Select 1 to 2 random exam objects
                num_objs = random.choices([1, 2, 0], weights=[0.6, 0.3, 0.1])[0]
                classes_to_place = random.sample(list(CLASSES.keys()), k=min(num_objs, len(CLASSES)))

                # Ambient illumination variation (60 to 200)
                ambient = random.randint(70, 190)

                img, labels = generate_sample_image(
                    canvas_w=640,
                    canvas_h=480,
                    background_lum=ambient,
                    placed_classes=classes_to_place,
                )

                # Save image
                cv2.imwrite(img_path, img)

                # Save YOLO label file
                with open(lbl_path, "w") as f:
                    for cls_id, cx, cy, nw, nh in labels:
                        f.write(f"{cls_id} {cx:.5f} {cy:.5f} {nw:.5f} {nh:.5f}\n")
                        total_objects[cls_id] += 1

                total_images += 1

    print(f"Dataset generation complete. Total Images: {total_images}")
    for cid, name in CLASSES.items():
        print(f"  Class {cid} ({name:<16}): {total_objects[cid]} instances")

if __name__ == "__main__":
    build_dataset()

