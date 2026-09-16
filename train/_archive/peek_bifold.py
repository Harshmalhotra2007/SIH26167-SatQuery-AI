# train/peek_bifold.py
from huggingface_hub import HfApi

api = HfApi()

print("=== Datasets under BIFOLD-BigEarthNetv2-0 ===")
for ds in api.list_datasets(author="BIFOLD-BigEarthNetv2-0", limit=50):
    print(f"  {ds.id}")

print("\n=== Datasets matching 'bigearthnet' ===")
for ds in api.list_datasets(search="bigearthnet", limit=50):
    print(f"  {ds.id}")

print("\n=== Datasets matching 'sentinel-2' or 's2' with images ===")
for ds in api.list_datasets(search="sentinel-2", limit=30):
    print(f"  {ds.id}")
