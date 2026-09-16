# train/peek_bigearth_s2.py
from datasets import load_dataset

# Try the blackline-atlas corpus, which pairs patch_id with derived RGB images
DATASET_PATH = "ChrisRPL/blackline-atlas-training-corpus-v1"
print(f"Loading {DATASET_PATH} (streaming)...")

try:
    ds = load_dataset(DATASET_PATH, split="train", streaming=True)
    for i, ex in enumerate(ds):
        if i >= 3:
            break
        print(f"\n--- Sample {i + 1} ---")
        for k, v in ex.items():
            if hasattr(v, "size"):
                print(f"  {k}: PIL.Image size={v.size} mode={v.mode}")
            elif isinstance(v, (list, tuple)) and len(v) > 5:
                print(f"  {k}: list[{len(v)}] first={v[0] if v else 'empty'}")
            else:
                preview = str(v)[:200] if v is not None else "None"
                print(f"  {k}: {preview}")
except Exception as e:
    print(f"ERROR loading {DATASET_PATH}: {e}")
    print("\nTrying alternative: hackelle/BigEarthNetV2-LMDB")
    try:
        ds = load_dataset("hackelle/BigEarthNetV2-LMDB", split="all_data", streaming=True)
        for i, ex in enumerate(ds):
            if i >= 3:
                break
            print(f"\n--- Sample {i + 1} (LMDB) ---")
            for k, v in ex.items():
                preview = str(v)[:150] if v is not None else "None"
                print(f"  {k}: {preview}")
    except Exception as e2:
        print(f"ERROR loading LMDB dataset: {e2}")