import io
from pathlib import Path
from typing import Tuple
from PIL import Image
import numpy as np


class ImageService:
    def __init__(self, upload_dir: Path):
        self.upload_dir = upload_dir

    def save(self, content: bytes, dest: Path) -> Tuple[int, int]:
        try:
            img = Image.open(io.BytesIO(content)).convert("RGB")
        except Exception:
            raise ValueError("invalid image bytes")
        w, h = img.size
        img.save(dest, format="JPEG", quality=90)
        return w, h

    def load(self, path: Path) -> np.ndarray:
        try:
            img = Image.open(path).convert("RGB")
            return np.array(img)
        except Exception:
            raise ValueError("cannot decode image")

    def encode_png(self, img: np.ndarray) -> bytes:
        pil_img = Image.fromarray(img)
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        return buf.getvalue()

    def to_pil(self, img: np.ndarray) -> Image.Image:
        if isinstance(img, Image.Image):
            return img
        return Image.fromarray(img)
