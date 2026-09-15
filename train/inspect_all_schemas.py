from datasets import load_dataset, get_dataset_split_names

def run_snippet(path, split_name=None):
    print(f"\n==================== SCHEMA FOR: {path} ====================")
    try:
        splits = get_dataset_split_names(path)
        print("Splits:", splits)
        s = split_name or (splits[0] if splits else "train")
    except Exception as e:
        print(f"Error getting splits for {path}: {e}")
        s = split_name or "train"

    try:
        ds = load_dataset(path, split=s, streaming=True)
        ex = next(iter(ds))
        print("Keys:", list(ex.keys()))

        # Check for PIL images
        for k, v in ex.items():
            if hasattr(v, "size"):
                print(f"  [PIL Check] {k}: PIL.Image size={v.size} mode={v.mode}")

        for k, v in ex.items():
            t = type(v).__name__
            if isinstance(v, (str, bytes)):
                s_str = repr(v[:200])
            elif isinstance(v, list):
                s_str = f"list[{len(v)}]"
            elif isinstance(v, dict):
                s_str = f"dict keys={list(v.keys())[:10]}"
            else:
                s_str = repr(v)[:120]
            print(f"  {k}: {t} = {s_str}")

        for k, v in ex.items():
            if isinstance(v, (list, dict)) and k not in ("image", "patch", "img"):
                print(f"\nNested '{k}':")
                sample = v[0] if isinstance(v, list) and v else v
                if isinstance(sample, dict):
                    for kk, vv in list(sample.items())[:10]:
                        print(f"    {kk}: {repr(str(vv)[:100])}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    run_snippet("BIFOLD-BigEarthNetv2-0/BigEarthNet.txt", split_name="all_data")
    run_snippet("ljx620/CDVQA")
    run_snippet("xiang709/VRSBench")
