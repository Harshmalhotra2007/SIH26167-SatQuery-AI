# train/peek_bigearth_images.py
from datasets import load_dataset

print("Loading bigearthnet/bigearthnet (streaming)...")
ds = load_dataset("bigearthnet/bigearthnet", split="train", streaming=True)

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
            preview = str(v)[:150] if v is not None else "None"
            print(f"  {k}: {preview}")