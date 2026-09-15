"""
train/dataset_loader.py
Dataset loader & instruction formatter for BigEarthNet.txt (BIFOLD-BigEarthNetv2-0/BigEarthNet.txt).
Reads remote sensing image-text pairs in streaming mode and converts them into vision-language instruction tuning format.
"""

import logging
from typing import Iterator, Dict, Any, List
from PIL import Image
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BIGEARTHNET_REPO = "BIFOLD-BigEarthNetv2-0/BigEarthNet.txt"

CATEGORIES_19 = [
    "Urban fabric", "Industrial or commercial units", "Arable land", "Permanent crops",
    "Pastures", "Complex cultivation patterns", "Land principally occupied by agriculture",
    "Agro-forestry areas", "Broad-leaved forest", "Coniferous forest", "Mixed forest",
    "Natural grassland", "Moors and heathland", "Sclerophyllous vegetation", "Transitional woodland-shrub",
    "Beaches, dunes, sands", "Inland wetlands", "Coastal wetlands", "Water bodies"
]

def format_bigearthnet_sample(sample: Dict[str, Any]) -> Dict[str, Any]:
    """
    Formats a raw BigEarthNet.txt sample into an instruction-tuning format suitable for VLM SFT.
    """
    labels = sample.get("labels", sample.get("label", []))
    if isinstance(labels, list):
        label_str = ", ".join(str(l) for l in labels)
    else:
        label_str = str(labels)
    
    # Extract images if present
    img_opt = sample.get("optical_image", sample.get("image", None))
    img_sar = sample.get("sar_image", None)
    
    instruction = (
        "Analyze this co-registered remote sensing patch (Sentinel-1 SAR / Sentinel-2 Optical) "
        "and list the predominant land cover classes and surface characteristics."
    )
    
    response = (
        f"The remote sensing imagery patch shows the following land cover classifications: {label_str}. "
        f"The optical spectral signatures and SAR backscatter characteristics confirm multi-spectral land cover activity."
    )
    
    return {
        "instruction": instruction,
        "response": response,
        "labels": labels,
        "optical_image": img_opt,
        "sar_image": img_sar
    }

def stream_bigearthnet_dataset(limit: int = 100) -> List[Dict[str, Any]]:
    """
    Stream samples from BigEarthNet.txt dataset.
    """
    logger.info(f"Streaming up to {limit} samples from {BIGEARTHNET_REPO}...")
    samples = []
    try:
        from datasets import load_dataset
        ds = load_dataset(BIGEARTHNET_REPO, streaming=True, split="train")
        for i, raw_sample in enumerate(ds):
            if i >= limit:
                break
            formatted = format_bigearthnet_sample(raw_sample)
            samples.append(formatted)
        logger.info(f"Successfully formatted {len(samples)} BigEarthNet.txt samples.")
    except Exception as e:
        logger.warning(f"Could not stream live dataset ({e}). Generating synthetic BigEarthNet.txt samples for pipeline validation...")
        # Synthetic fallback for offline validation
        for i in range(limit):
            synthetic_img = Image.fromarray(np.random.randint(0, 255, (128, 128, 3), dtype=np.uint8))
            samples.append({
                "instruction": "Analyze this Sentinel remote sensing patch for land cover classification.",
                "response": "The patch displays Arable land, Coniferous forest, and Water bodies.",
                "labels": ["Arable land", "Coniferous forest", "Water bodies"],
                "optical_image": synthetic_img,
                "sar_image": synthetic_img
            })
    return samples

if __name__ == "__main__":
    data = stream_bigearthnet_dataset(limit=5)
    print(f"Sample formatted output: {data[0]['instruction']} -> {data[0]['response']}")
