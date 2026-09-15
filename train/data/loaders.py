from pathlib import Path
from datasets import load_from_disk, load_dataset


def load_dataset_safe(path_or_id, streaming=True, split="train"):
    p = Path(path_or_id)
    if p.exists():
        return load_from_disk(p)
    return load_dataset(path_or_id, split=split, streaming=streaming)
