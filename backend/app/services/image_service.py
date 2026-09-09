from pathlib import Path
from typing import Tuple
import cv2
import numpy as np
from PIL import Image
import io


class ImageService:
    def __init__(self, upload_dir: Path):
        self.upload_dir = upload_dir

    def save(self, content: bytes, dest: Path) -> Tuple[int, int]:
        arr = np.frombuffer(content, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("invalid image bytes")
        h, w = img.shape[:2]
        cv2.imwrite(str(dest), img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        return int(w), int(h)

    def load(self, path: Path) -> np.ndarray:
        arr = np.fromfile(str(path), dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("cannot decode image")
        return img

    def encode_png(self, img: np.ndarray) -> bytes:
        ok, buf = cv2.imencode(".png", img)
        if not ok:
            raise ValueError("png encode failed")
        return buf.tobytes()

    def to_pil(self, img: np.ndarray) -> Image.Image:
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        return Image.fromarray(img_rgb)
