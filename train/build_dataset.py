"""
train/build_dataset.py

Joins the S2 imagery dataset (jfang/BigEarthS2-all-test-1k-balanced) with the
text annotation dataset (BIFOLD-BigEarthNetv2-0/BigEarthNet.txt) via patch_id,
saves local PNG images, and builds a JSONL dataset for QLoRA fine-tuning.
"""

import os
import json
from pathlib import Path
from tqdm import tqdm
from PIL import Image
from datasets import load_dataset


def main():
    print("=== Task 1: Building Local BigEarthNet Joined Training Set ===")
    
    # 1. Output Directories
    data_dir = Path("data")
    images_dir = data_dir / "bigearth_s2"
    output_jsonl = data_dir / "train_samples.jsonl"
    
    data_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)

    # 2. Load jfang/BigEarthS2-all-test-1k-balanced (Small test split ~1000 items)
    print("\n[1/3] Loading jfang/BigEarthS2-all-test-1k-balanced (split='test')...")
    ds_images = load_dataset("jfang/BigEarthS2-all-test-1k-balanced", split="test")
    
    if len(ds_images) == 0:
        raise RuntimeError("No images loaded from jfang dataset")
    
    print(f"Loaded {len(ds_images)} image items from jfang dataset.")

    # 3. Save images locally and map patch_id -> image_path
    patch_to_path = {}
    print("\n[2/3] Extracting and saving Sentinel-2 image patches to data/bigearth_s2/...")
    for sample in tqdm(ds_images, desc="Saving images"):
        patch_id = sample.get("patch_id")
        if not patch_id:
            continue
        
        safe_id = str(patch_id).replace("/", "_")
        image_path = images_dir / f"{safe_id}.png"
        
        img = sample.get("image")
        if isinstance(img, Image.Image):
            img.save(image_path, format="PNG")
        else:
            # Fallback for PIL conversion if stored as dict/array
            img_pil = Image.fromarray(img)
            img_pil.save(image_path, format="PNG")
            
        patch_to_path[patch_id] = str(image_path).replace("\\", "/")

    target_patch_ids = set(patch_to_path.keys())
    print(f"Mapped {len(target_patch_ids)} unique patch_ids to local disk.")

    # 4. Stream BIFOLD-BigEarthNetv2-0/BigEarthNet.txt (split='all_data')
    print("\n[3/3] Streaming BIFOLD-BigEarthNetv2-0/BigEarthNet.txt (split='all_data')...")
    ds_text_stream = load_dataset(
        "BIFOLD-BigEarthNetv2-0/BigEarthNet.txt",
        split="all_data",
        streaming=True
    )

    matched_samples = []
    found_patch_ids = set()
    max_stream_rows = 1000000

    pbar = tqdm(total=max_stream_rows, desc="Streaming Q&A annotations")
    for row_idx, ex in enumerate(ds_text_stream):
        if row_idx >= max_stream_rows:
            print(f"\nReached maximum streaming limit of {max_stream_rows} rows.")
            break
        
        pbar.update(1)
        pid = ex.get("patch_id")
        if pid in target_patch_ids:
            matched_samples.append({
                "image_path": patch_to_path[pid],
                "question": ex.get("input", ""),
                "answer": ex.get("output", ""),
                "type": ex.get("type", ""),
                "category": ex.get("category", ""),
                "patch_id": pid
            })
            found_patch_ids.add(pid)

        # Early exit if all patch_ids matched
        if len(found_patch_ids) == len(target_patch_ids):
            print(f"\nSuccessfully matched all {len(target_patch_ids)} patch_ids early!")
            break
            
    pbar.close()

    if len(matched_samples) == 0:
        raise RuntimeError(
            "Zero matching samples found between jfang patch_ids and BIFOLD BigEarthNet.txt streaming dataset."
        )

    # 5. Write matched samples to data/train_samples.jsonl
    print(f"\nWriting {len(matched_samples)} joined samples to {output_jsonl}...")
    with open(output_jsonl, "w", encoding="utf-8") as f:
        for sample in matched_samples:
            f.write(json.dumps(sample) + "\n")

    print("\n=== Task 1 Complete ===")
    print(f"Total Unique Images Loaded: {len(target_patch_ids)}")
    print(f"Matched Image-Text Samples: {len(matched_samples)}")
    print(f"Dataset File Created: {output_jsonl}")


if __name__ == "__main__":
    main()