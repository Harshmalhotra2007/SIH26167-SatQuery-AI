"""
train/inspect_all_schemas.py
Inspect dataset structures for BigEarthNet.txt, CDVQA, and VRSBench on Hugging Face.
Prints field names, data types, annotation formats, and sample metadata without loading full datasets into RAM.
"""

import sys
import logging
from typing import Dict, Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

TARGET_DATASETS = {
    "BigEarthNet.txt": "BIFOLD-BigEarthNetv2-0/BigEarthNet.txt",
    "CDVQA": "ljx620/CDVQA",
    "VRSBench": "xiang709/VRSBench"
}

def inspect_dataset(name: str, repo_id: str) -> Dict[str, Any]:
    logger.info(f"=== Inspecting Schema for {name} ({repo_id}) ===")
    try:
        from datasets import load_dataset_builder
        builder = load_dataset_builder(repo_id)
        info = builder.info
        print(f"\n[+] Dataset: {name}")
        print(f"    Description: {info.description[:200] if info.description else 'N/A'}...")
        print(f"    Features: {info.features}")
        print(f"    Splits: {list(info.splits.keys()) if info.splits else 'Unknown'}")
        return {
            "name": name,
            "status": "success",
            "features": str(info.features),
            "splits": list(info.splits.keys()) if info.splits else []
        }
    except Exception as e:
        logger.warning(f"Could not load builder for {repo_id}: {e}")
        # Fallback to streaming inspection sample
        try:
            from datasets import load_dataset
            ds = load_dataset(repo_id, streaming=True, split="train")
            sample = next(iter(ds))
            print(f"\n[+] Dataset: {name} (Streamed Sample)")
            print(f"    Sample Keys: {list(sample.keys())}")
            return {
                "name": name,
                "status": "success_streamed",
                "sample_keys": list(sample.keys())
            }
        except Exception as ex:
            logger.error(f"Failed to inspect {name}: {ex}")
            return {"name": name, "status": "error", "error": str(ex)}

def main():
    print("=========================================================")
    print(" SIH 26167 Schema Inspection: BigEarthNet.txt, CDVQA, VRSBench")
    print("=========================================================")
    results = {}
    for name, repo_id in TARGET_DATASETS.items():
        results[name] = inspect_dataset(name, repo_id)
    
    print("\nSummary of Dataset Inspection:")
    for name, res in results.items():
        print(f" - {name}: {res['status']}")

if __name__ == "__main__":
    main()
