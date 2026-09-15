from datasets import load_dataset
import json

DATASETS = {
    "bigearthnet": "BIFOLD-BigEarthNetv2-0/BigEarthNet.txt",
    "cdvqa": "ljx620/CDVQA",
    "vrsbench": "xiang709/VRSBench",
}

for name, path in DATASETS.items():
    print(f"\n{'=' * 60}")
    print(f"Dataset: {name}")
    print(f"Path: {path}")
    try:
        ds = load_dataset(path, split="train", streaming=True)
        ex = next(iter(ds))
        print("Keys:", list(ex.keys()))
        for k, v in ex.items():
            val_str = str(v)[:200].replace('\n', ' ')
            print(f"  {k}: {type(v).__name__} = {val_str}")
        # Print splits if available
        try:
            splits = ds.info.splits
            print(f"Splits: {splits}")
        except Exception:
            pass
    except Exception as e:
        print(f"ERROR: {e}")
