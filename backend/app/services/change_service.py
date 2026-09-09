import io
import time
from pathlib import Path
from typing import Tuple
import cv2
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

        gray1 = cv2.cvtColor(img1_aligned, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(img2_aligned, cv2.COLOR_BGR2GRAY)

        diff = cv2.absdiff(gray1, gray2)
        _, mask = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.dilate(mask, kernel, iterations=1)

        change_pct = float(np.count_nonzero(mask)) / mask.size * 100

        overlay = img2_aligned.copy()
        overlay[mask > 0] = (0, 0, 255)

        out_name = f"diff_{int(time.time())}.png"
        out_path = Path(self.image_service.upload_dir) / out_name
        cv2.imwrite(str(out_path), overlay, [cv2.IMWRITE_PNG_COMPRESSION, 3])

        changed = cv2.bitwise_and(img2_aligned, img2_aligned, mask=mask)
        x, y, w, h = self._tight_crop(mask)
        crop = changed[y : y + h, x : x + w]
        crop_path = Path(self.image_service.upload_dir) / f"crop_{int(time.time())}.png"
        cv2.imwrite(str(crop_path), crop, [cv2.IMWRITE_PNG_COMPRESSION, 3])

        description = await self.vlm_service.ask(crop_path, "Describe what changed in this region.")

        return {
            "overlay_url": f"/static/{out_name}",
            "description": description,
            "change_percentage": round(change_pct, 2),
        }

    def _decode(self, content: bytes) -> np.ndarray:
        arr = np.frombuffer(content, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("invalid image")
        return img

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
