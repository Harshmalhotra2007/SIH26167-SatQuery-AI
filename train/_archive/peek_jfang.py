# train/peek_jfang.py
from datasets import load_dataset

# Using the "test" split with 1k balanced examples for a quick verification
DATASET_PATH = "jfang/BigEarthS2-all-test-1k-balanced"
print(f"Loading {DATASET_PATH} (streaming)...")

ds = load_dataset(DATASET_PATH, split="test", streaming=True)

for i, ex in enumerate(ds):
    if i >= 2:
        break
    print(f"\n--- Sample {i + 1} ---")
    for k, v in ex.items():
        # Check for PIL Image objects
        if hasattr(v, "size"):
            print(f"  {k}: PIL.Image size={v.size} mode={v.mode}")
        # Check for lists
        elif isinstance(v, (list, tuple)):
            preview = str(v)[:150]
            print(f"  {k}: {type(v).__name__}[{len(v)}] = {preview}...")
        # Print other types
        else:
            preview = str(v)[:150] if v is not None else "None"
            print(f"  {k}: {preview}")