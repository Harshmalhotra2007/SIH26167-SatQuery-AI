# train/peek_bigearth.py
from datasets import load_dataset

ds = load_dataset(
    "BIFOLD-BigEarthNetv2-0/BigEarthNet.txt",
    split="all_data",
    streaming=True,
)

for i, ex in enumerate(ds):
    if i >= 5:
        break
    print(f"\n--- Sample {i + 1} ---")
    for k, v in ex.items():
        preview = str(v)[:200] if v is not None else "None"
        print(f"  {k}: {preview}")