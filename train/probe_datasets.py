from huggingface_hub import HfApi

api = HfApi()
terms = ["bigearthnet", "cdvqa", "vrsbench", "rsvqa", "levir", "bigearthnet-txt"]

for term in terms:
    print(f"\n=== {term} ===")
    try:
        hits = list(api.list_datasets(search=term, limit=20))
    except Exception as e:
        print(f"  ERROR: {e}")
        continue
    if not hits:
        print("  (no results)")
    for ds in hits:
        dl = getattr(ds, "downloads", "?")
        print(f"  {ds.id}  | downloads: {dl}")
