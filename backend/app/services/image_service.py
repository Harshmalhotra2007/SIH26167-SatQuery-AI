import io
from pathlib import Path
from typing import Tuple
from PIL import Image
import numpy as np


class ImageService:
    def __init__(self, upload_dir: Path):
        self.upload_dir = upload_dir

    def save(self, content: bytes, dest: Path) -> Tuple[int, int]:
        """
        Saves uploaded image content. Supports JPEG, PNG, WEBP, and GeoTIFF (.tif / .tiff).
        Normalizes multi-band GeoTIFF imagery to RGB JPEG for web & VLM compatibility.
        """
        try:
            # Check if file is GeoTIFF/TIFF
            is_tiff = str(dest).lower().endswith(('.tif', '.tiff'))
            if is_tiff:
                try:
                    import tifffile
                    arr = tifffile.imread(io.BytesIO(content))
                    img = self.normalize_tiff_array(arr)
                except Exception:
                    img = Image.open(io.BytesIO(content)).convert("RGB")
            else:
                img = Image.open(io.BytesIO(content)).convert("RGB")
        except Exception as e:
            raise ValueError(f"invalid image or GeoTIFF bytes: {e}")
        
        w, h = img.size
        img.save(dest, format="JPEG", quality=90)
        return w, h

    def load(self, path: Path) -> np.ndarray:
        try:
            if str(path).lower().endswith(('.tif', '.tiff')):
                try:
                    import tifffile
                    arr = tifffile.imread(path)
                    img = self.normalize_tiff_array(arr)
                    return np.array(img)
                except Exception:
                    pass
            img = Image.open(path).convert("RGB")
            return np.array(img)
        except Exception:
            raise ValueError("cannot decode image or GeoTIFF")

    def normalize_tiff_array(self, arr: np.ndarray) -> Image.Image:
        """
        Normalizes multi-channel GeoTIFF numpy arrays (e.g. 1-band SAR, 4+ band optical) to 8-bit RGB Image.
        """
        if arr.ndim == 2:
            # Single-band SAR or grayscale
            p2, p98 = np.percentile(arr, (2, 98))
            arr_norm = np.clip((arr - p2) / (p98 - p2 + 1e-6) * 255, 0, 255).astype(np.uint8)
            return Image.fromarray(arr_norm).convert("RGB")
        elif arr.ndim == 3:
            # Multi-channel (e.g., [C, H, W] or [H, W, C])
            if arr.shape[0] in [1, 2, 3, 4, 8, 12, 13]:
                # Channel first [C, H, W] -> transpose to [H, W, C]
                arr = np.transpose(arr, (1, 2, 0))
            
            # Select first 3 channels (RGB / SAR VV-VH-Ratio)
            rgb_bands = arr[:, :, :3]
            p2, p98 = np.percentile(rgb_bands, (2, 98), axis=(0, 1))
            arr_norm = np.clip((rgb_bands - p2) / (p98 - p2 + 1e-6) * 255, 0, 255).astype(np.uint8)
            return Image.fromarray(arr_norm).convert("RGB")
        else:
            return Image.fromarray(arr).convert("RGB")

    def encode_png(self, img: np.ndarray) -> bytes:
        pil_img = Image.fromarray(img)
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        return buf.getvalue()

    def to_pil(self, img: np.ndarray) -> Image.Image:
        if isinstance(img, Image.Image):
            return img
        return Image.fromarray(img)
