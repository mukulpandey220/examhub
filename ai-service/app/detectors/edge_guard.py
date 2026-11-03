import numpy as np
from typing import Tuple, Optional, List
from app.core.types import BoundingBox

class ViewportEdgeGuard:
    """
    Refines face and object boundary edge detection:
    1. Detects when a candidate's face or body is drifting out of frame borders
       (left, right, top, bottom edge proximity).
    2. Clamps and pads bounding boxes cleanly inside image coordinates to prevent
       negative coordinates, overflow, or edge clipping artifacts.
    """
    def __init__(self, edge_margin_percent: float = 0.05):
        # 5% margin from borders triggers an edge proximity alert
        self.edge_margin_percent = edge_margin_percent

    def check_edge_proximity(
        self,
        box: BoundingBox,
        frame_shape: Tuple[int, int, ...]
    ) -> Tuple[bool, Optional[str]]:
        """
        Returns (is_near_edge, edge_name) if bounding box is within edge margin.
        """
        h, w = frame_shape[:2]
        margin_x = w * self.edge_margin_percent
        margin_y = h * self.edge_margin_percent

        box_right = box.x + box.width
        box_bottom = box.y + box.height

        near_left = box.x <= margin_x
        near_right = box_right >= (w - margin_x)
        near_top = box.y <= margin_y
        near_bottom = box_bottom >= (h - margin_y)

        if near_left and near_right:
            return True, "horizontal_borders"
        elif near_left:
            return True, "left"
        elif near_right:
            return True, "right"
        elif near_top:
            return True, "top"
        elif near_bottom:
            return True, "bottom"

        return False, None

    def clamp_and_refine_box(
        self,
        x: float,
        y: float,
        width: float,
        height: float,
        frame_shape: Tuple[int, int, ...]
    ) -> BoundingBox:
        """
        Clamps bounding box to valid frame coordinates and ensures minimum dimension.
        """
        h, w = frame_shape[:2]

        clamped_x = max(0.0, min(float(x), float(w - 1)))
        clamped_y = max(0.0, min(float(y), float(h - 1)))
        clamped_w = max(1.0, min(float(width), float(w - clamped_x)))
        clamped_h = max(1.0, min(float(height), float(h - clamped_y)))

        return BoundingBox(
            x=round(clamped_x, 1),
            y=round(clamped_y, 1),
            width=round(clamped_w, 1),
            height=round(clamped_h, 1),
        )

