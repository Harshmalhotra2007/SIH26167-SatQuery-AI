"""
train/dataset_loader.py
Dataset loader & instruction formatter for BigEarthNet.txt (BIFOLD-BigEarthNetv2-0/BigEarthNet.txt).
Reads remote sensing image-text pairs in streaming mode and converts them into vision-language instruction tuning format.
REQUIRES: BigEarthNet.txt dataset with actual image patches.
"""

import logging
from typing import Iterator, Dict, Any, List
from PIL import Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BIGEARTHNET_REPO = "BIFOLD-BigEarthNetv2-0/BigEarthNet.txt"

def format_bigearthnet_sample(sample: Dict[str, Any]) -> Dict[str, Any]:
    """
    Formats a raw BigEarthNet.txt sample into an instruction-tuning format suitable for VLM SFT.
    BigEarthNet.txt is text-only - images must be joined with original BigEarthNet dataset.
    """
    # BigEarthNet.txt has: input (question), output (answer), category, type, country, season, etc.
    question = sample.get("input", "Describe this satellite image.")
    answer = sample.get("output", "Unknown")
    category = sample.get("category", "unknown")
    country = sample.get("country", "unknown")
    season = sample.get("season", "unknown")

    instruction = (
        f"Analyze this satellite image patch from {country} ({season}). "
        f"Question: {question}"
    )

    response = answer

    return {
        "instruction": instruction,
        "answer": response,
        "category": category,
        "country": country,
        "season": season,
        "source": BIGEARTHNET_REPO
    }

def stream_bigearthnet_dataset(limit: int = 100) -> List[Dict[str, Any]]:
    """
    Stream samples from BigEarthNet.txt dataset (text annotations only).
    NOTE: Images must be loaded separately from original BigEarthNet dataset.
    """
    logger.info(f"Streaming up to {limit} text samples from {BIGEARTHNET_REPO}...")
    samples = []
    try:
        from datasets import load_dataset
        # Note: BigEarthNet.txt is text-only, uses 'all_data' split
        ds = load_dataset(BIGEARTHNET_REPO, streaming=True, split="all_data")
        for i, raw_sample in enumerate(ds):
            if i >= limit:
                break
            formatted = format_bigearthnet_sample(raw_sample)
            samples.append(formatted)
        logger.info(f"Successfully formatted {len(samples)} BigEarthNet.txt text samples.")
        logger.info("NOTE: Image patches require joining with original BigEarthNet dataset.")
    except Exception as e:
        logger.error(f"Failed to load BigEarthNet.txt dataset: {e}")
        logger.error("Ensure you have network access to HuggingFace Hub.")
        raise
    return samples

if __name__ == "__main__":
    data = stream_bigearthnet_dataset(limit=5)
    print(f"\nSample formatted output:")
    for item in data:
        print(f"  Q: {item['instruction'][:80]}...")
        print(f"  A: {item['answer'][:80]}...")
        print(f"  Category: {item['category']}, Country: {item['country']}")
