"""
eval/eval_bigearth.py

Evaluate Qwen2-VL-2B (base or LoRA-adapted) on a held-out split of BigEarthNet.txt.
Joins each Q&A pair with its corresponding Sentinel-2 image via patch_id.
Exact-match scoring on normalized strings.

Usage:
    python eval/eval_bigearth.py --samples 2000 --output eval/results_bigearth_base.json
    python eval/eval_bigearth.py --adapter-path train/checkpoints/final_adapter_400steps \
        --samples 2000 --output eval/results_bigearth_adapted.json
"""

import os
import sys
import json
import argparse
from typing import List, Dict, Any

import torch
from tqdm import tqdm

from transformers import (
    Qwen2VLForConditionalGeneration,
    AutoProcessor,
    BitsAndBytesConfig,
)
from peft import PeftModel

PROMPT_PREFIX = (
    "Answer the following question about this satellite image in as few words "
    "as possible. "
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Evaluate Qwen2-VL-2B on a held-out BigEarthNet.txt split"
    )
    parser.add_argument(
        "--adapter-path",
        type=str,
        default=None,
        help="Path to LoRA adapter directory (optional)",
    )
    parser.add_argument(
        "--base-model",
        type=str,
        default="Qwen/Qwen2-VL-2B-Instruct",
        help="Base model ID or path",
    )
    parser.add_argument(
        "--image-dir",
        type=str,
        default="data/bigearth_s2",
        help="Directory containing saved Sentinel-2 PNG patches",
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=2000,
        help="Number of held-out samples to evaluate",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="eval/results_bigearth.json",
        help="Output JSON path",
    )
    return parser.parse_args()


def normalize(s: str) -> str:
    s = s.lower().strip()
    s = s.rstrip(".!?,")
    s = " ".join(s.split())
    return s


def load_held_out_samples(image_dir: str, samples_limit: int) -> List[Dict[str, Any]]:
    """Stream BigEarthNet.txt, keep only rows whose image exists locally."""
    from datasets import load_dataset

    ds = load_dataset(
        "BIFOLD-BigEarthNetv2-0/BigEarthNet.txt",
        split="all_data",
        streaming=True,
    )

    collected: List[Dict[str, Any]] = []
    for row in ds:
        pid = row.get("patch_id")
        if not pid:
            continue
        safe = pid.replace("/", "_")
        img_path = os.path.join(image_dir, f"{safe}.png")
        if not os.path.exists(img_path):
            continue
        collected.append({
            "image_path": img_path,
            "question": row.get("input", ""),
            "answer": row.get("output", ""),
            "type": row.get("type", ""),
            "category": row.get("category", ""),
            "patch_id": pid,
        })
        if len(collected) >= samples_limit:
            break

    return collected


def load_model(base_model: str, adapter_path: str = None):
    bnb = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=torch.bfloat16,
    )
    model = Qwen2VLForConditionalGeneration.from_pretrained(
        base_model,
        quantization_config=bnb,
        device_map="auto",
    )
    processor = AutoProcessor.from_pretrained(base_model)
    processor.tokenizer.padding_side = "right"

    if adapter_path is not None:
        model = PeftModel.from_pretrained(model, adapter_path)

    return model, processor


@torch.no_grad()
def evaluate(model, processor, samples: List[Dict[str, Any]]):
    from PIL import Image

    total_correct = 0
    total = 0
    preview: List[Dict[str, Any]] = []

    for i, s in enumerate(tqdm(samples, desc="BigEarthNet eval")):
        image = Image.open(s["image_path"]).convert("RGB")
        question = s["question"]
        gt = s["answer"]

        messages = [{
            "role": "user",
            "content": [
                {"type": "image"},
                {"type": "text", "text": PROMPT_PREFIX + question},
            ],
        }]
        text = processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        inputs = processor(
            text=text, images=[image], return_tensors="pt"
        ).to("cuda")

        try:
            out = model.generate(
                **inputs, max_new_tokens=20, do_sample=False
            )
            pred = processor.decode(
                out[0, inputs["input_ids"].shape[1]:],
                skip_special_tokens=True,
            ).strip()
        except Exception as e:
            print(f"\nWarning: generation failed for sample {i}: {e}")
            pred = ""

        correct = normalize(pred) == normalize(gt)
        total_correct += int(correct)
        total += 1

        if i < 20:
            preview.append({
                "question": question,
                "ground_truth": gt,
                "prediction": pred,
                "correct": correct,
            })

    accuracy = total_correct / total if total > 0 else 0.0
    return {
        "overall_accuracy": round(accuracy, 4),
        "samples_evaluated": total,
        "predictions_sample": preview,
    }


def main():
    args = parse_args()

    print(f"Loading held-out BigEarthNet samples (limit={args.samples})...")
    samples = load_held_out_samples(args.image_dir, args.samples)
    print(f"Collected {len(samples)} samples with local images")

    if len(samples) == 0:
        raise RuntimeError(
            "No samples with local images found. "
            "Ensure data/bigearth_s2/ contains the PNG patches."
        )

    print(f"Loading model: {args.base_model}")
    model, processor = load_model(args.base_model, args.adapter_path)
    print(f"Adapter: {args.adapter_path or 'none'}")

    print("\nRunning evaluation...")
    results = evaluate(model, processor, samples)

    assert 0.0 <= results["overall_accuracy"] <= 1.0, "Accuracy out of range"
    assert results["samples_evaluated"] > 0, "No samples evaluated"

    output = {
        "base_model": args.base_model,
        "adapter_path": args.adapter_path,
        "samples_evaluated": results["samples_evaluated"],
        "overall_accuracy": results["overall_accuracy"],
        "predictions_sample": results["predictions_sample"],
    }

    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nResults written to {args.output}")
    print(f"\n{'='*60}")
    print(
        f"BigEarthNet.txt | N={results['samples_evaluated']} | "
        f"accuracy={results['overall_accuracy']:.4f} | "
        f"adapter={args.adapter_path or 'none'}"
    )
    print(f"{'='*60}")


if __name__ == "__main__":
    main()