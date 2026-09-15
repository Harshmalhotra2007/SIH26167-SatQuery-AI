import io
import time
from pathlib import Path
from typing import Tuple
import numpy as np
from PIL import Image
from fastapi import UploadFile

from app.services.image_service import ImageService
from app.services.vlm_service import VLMService


class ChangeService:
    def __init__(self, image_service: ImageService, vlm_service: VLMService):
        self.image_service = image_service
        self.vlm_service = vlm_service

    async def analyze(self, before: UploadFile, after: UploadFile):
        b_content = await before.read()
        a_content = await after.read()
        img1 = self._decode(b_content)
        img2 = self._decode(a_content)
        img1_aligned, img2_aligned = self._align(img1, img2)

        # Grayscale conversion using luminance weights (0.299 R + 0.587 G + 0.114 B)
        gray1 = np.dot(img1_aligned[..., :3], [0.299, 0.587, 0.114]).astype(np.uint8)
        gray2 = np.dot(img2_aligned[..., :3], [0.299, 0.587, 0.114]).astype(np.uint8)

        # Absolute difference and thresholding
        diff = np.abs(gray1.astype(np.int16) - gray2.astype(np.int16)).astype(np.uint8)
        mask = (diff > 25).astype(np.uint8) * 255

        change_pct = float(np.count_nonzero(mask)) / mask.size * 100

        # Red overlay for changed pixels (RGB: [255, 0, 0])
        overlay = img2_aligned.copy()
        overlay[mask > 0] = [255, 0, 0]

        out_name = f"diff_{int(time.time())}.png"
        out_path = Path(self.image_service.upload_dir) / out_name
        Image.fromarray(overlay).save(out_path, format="PNG")

        # Crop changed region
        x, y, w, h = self._tight_crop(mask)
        crop = img2_aligned[y : y + h, x : x + w]
        crop_path = Path(self.image_service.upload_dir) / f"crop_{int(time.time())}.png"
        Image.fromarray(crop).save(crop_path, format="PNG")

        description = await self.vlm_service.ask(crop_path, "Describe what changed in this region.")

        return {
            "overlay_url": f"/static/{out_name}",
            "description": description,
            "change_percentage": round(change_pct, 2),
        }

    def _decode(self, content: bytes) -> np.ndarray:
        try:
            img = Image.open(io.BytesIO(content)).convert("RGB")
            return np.array(img)
        except Exception:
            raise ValueError("invalid image")

    def _align(self, a: np.ndarray, b: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        h = min(a.shape[0], b.shape[0])
        w = min(a.shape[1], b.shape[1])
        return a[:h, :w], b[:h, :w]

    def _tight_crop(self, mask: np.ndarray) -> Tuple[int, int, int, int]:
        ys, xs = np.where(mask > 0)
        if len(xs) == 0:
            return 0, 0, mask.shape[1], mask.shape[0]
        x1, y1, x2, y2 = int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())
        return x1, y1, x2 - x1 + 1, y2 - y1 + 1
