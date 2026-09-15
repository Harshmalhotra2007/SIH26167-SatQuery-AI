import sys
import traceback
from datasets import load_dataset, get_dataset_split_names

def probe_dataset(path, default_split="train"):
    print(f"\n==================== DATASET: {path} ====================")
    try:
        splits = get_dataset_split_names(path)
        print("Splits:", splits)
        split_to_use = splits[0] if splits else default_split
    except Exception as e:
        print(f"Error getting split names: {e}")
        split_to_use = default_split

    try:
        ds = load_dataset(path, split=split_to_use, streaming=True)
        ex = next(iter(ds))
        print("Keys:", list(ex.keys()))
        for k, v in ex.items():
            if hasattr(v, "size"):  # PIL image check
                print(f"  {k}: PIL.Image size={v.size} mode={v.mode}")
            t = type(v).__name__
            if isinstance(v, (str, bytes)):
                s = repr(v[:200])
            elif isinstance(v, list):
                s = f"list[{len(v)}]"
            elif isinstance(v, dict):
                s = f"dict keys={list(v.keys())[:10]}"
            else:
                s = repr(v)[:120]
            print(f"  {k}: {t} = {s}")

        for k, v in ex.items():
            if isinstance(v, (list, dict)) and k not in ("image", "patch", "img"):
                print(f"\nNested '{k}':")
                sample = v[0] if isinstance(v, list) and v else v
                if isinstance(sample, dict):
                    for kk, vv in list(sample.items())[:10]:
                        print(f"    {kk}: {repr(str(vv)[:100])}")
    except Exception as e:
        print(f"ERROR probing {path}: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    probe_dataset("BIFOLD-BigEarthNetv2-0/BigEarthNet.txt")
    probe_dataset("ljx620/CDVQA")
    probe_dataset("xiang709/VRSBench")
