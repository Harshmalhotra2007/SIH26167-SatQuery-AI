"""
eval/eval_rsvqa.py

Evaluate Qwen2-VL-2B (base or LoRA-adapted) on RSVQA-LR-2k benchmark.
Measures exact-match accuracy on 2000 validation samples.
Reports overall and per-type (presence, comparison, other) accuracy.
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

PROMPT_PREFIX = "Answer the following question about this satellite image in as few words as possible. "


def parse_args():
    parser = argparse.ArgumentParser(
        description="Evaluate Qwen2-VL-2B on RSVQA-LR-2k benchmark"
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
        "--samples",
        type=int,
        default=None,
        help="Limit evaluation to first N samples (default: all 2000)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="eval/results_rsvqa.json",
        help="Output JSON path",
    )
    return parser.parse_args()


def normalize(s: str) -> str:
    """Normalize answer for comparison."""
    s = s.lower().strip()
    s = s.rstrip(".!?,")
    s = " ".join(s.split())
    return s


def classify_question(question: str) -> str:
    """Classify question type for per-type reporting."""
    q_lower = question.lower()
    # Counting questions are unsolvable by 2B VLMs — track separately
    if q_lower.startswith("what is the number") or q_lower.startswith("how many"):
        return "counting"
    if "less" in q_lower or "more" in q_lower or "equal" in q_lower:
        return "comparison"
    if q_lower.startswith(("is ", "are ", "is there", "are there")):
        return "presence"
    return "other"


def load_dataset(samples_limit: int = None):
    """Load RSVQA-LR-2k validation split."""
    from datasets import load_dataset
    ds = load_dataset("dmarsili/RSVQA-LR-2k", split="validation")
    if samples_limit is not None:
        ds = ds.select(range(min(samples_limit, len(ds))))
    return ds


def load_model(base_model: str, adapter_path: str = None):
    """Load Qwen2-VL-2B in 4-bit with optional LoRA adapter."""
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
        # Apply LoRA adapter at inference time.
        # Do NOT call merge_and_unload() — merging LoRA into a 4-bit quantized
        # base model is unsupported by PEFT and produces incorrect weights.
        model = PeftModel.from_pretrained(model, adapter_path)

    return model, processor


@torch.no_grad()
def evaluate(model, processor, dataset: List[Dict[str, Any]], samples_limit: int = None):
    """Run inference on dataset and compute accuracy."""
    results = []
    type_stats = {
        "presence": {"correct": 0, "total": 0},
        "counting": {"correct": 0, "total": 0},
        "comparison": {"correct": 0, "total": 0},
        "other": {"correct": 0, "total": 0},
    }
    total_correct = 0
    total_samples = 0

    # Use first 20 for predictions_sample
    sample_predictions = []

    for i, row in enumerate(tqdm(dataset, desc="RSVQA eval")):
        if samples_limit is not None and i >= samples_limit:
            break

        image = row["image"]
        question = row["question"]
        ground_truth = row["answer"]

        messages = [{
            "role": "user",
            "content": [
                {"type": "image"},
                {"type": "text", "text": PROMPT_PREFIX + question},
            ]
        }]

        # Apply chat template
        text = processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )

        # Process inputs
        inputs = processor(
            text=text,
            images=[image],
            return_tensors="pt",
        ).to("cuda")

        # Generate
        try:
            outputs = model.generate(
                **inputs,
                max_new_tokens=20,
                do_sample=False,
            )
            # Decode only new tokens
            generated_ids = outputs[:, inputs["input_ids"].shape[1]:]
            prediction = processor.decode(
                generated_ids[0],
                skip_special_tokens=True,
            ).strip()
        except Exception as e:
            print(f"\nWarning: Generation failed for sample {i}: {e}")
            prediction = ""

        # Normalize for comparison
        pred_norm = normalize(prediction)
        gt_norm = normalize(ground_truth)
        correct = pred_norm == gt_norm

        # Classify question type
        q_type = classify_question(question)
        type_stats[q_type]["total"] += 1
        if correct:
            type_stats[q_type]["correct"] += 1
            total_correct += 1
        total_samples += 1

        # Track first 20 predictions for inspection
        if i < 20:
            sample_predictions.append({
                "question": question,
                "ground_truth": ground_truth,
                "prediction": prediction,
                "correct": correct,
            })

    # Compute accuracies
    overall_accuracy = total_correct / total_samples if total_samples > 0 else 0.0
    by_type = {}
    for qtype, stats in type_stats.items():
        if stats["total"] > 0:
            by_type[qtype] = {
                "count": stats["total"],
                "accuracy": round(stats["correct"] / stats["total"], 4),
            }
        else:
            by_type[qtype] = {"count": 0, "accuracy": 0.0}

    return {
        "overall_accuracy": round(overall_accuracy, 4),
        "by_type": by_type,
        "total_samples": total_samples,
        "sample_predictions": sample_predictions,
    }


def main():
    args = parse_args()

    print(f"Loading dataset: dmarsili/RSVQA-LR-2k")
    dataset = load_dataset(samples_limit=args.samples)
    print(f"Loaded {len(dataset)} samples")

    print(f"Loading model: {args.base_model}")
    model, processor = load_model(args.base_model, args.adapter_path)
    print(f"Adapter: {args.adapter_path or 'none'}")

    print("\nRunning evaluation...")
    results = evaluate(model, processor, dataset, samples_limit=args.samples)

    # Assertions
    assert 0.0 <= results["overall_accuracy"] <= 1.0, \
        f"Accuracy out of range: {results['overall_accuracy']}"
    assert results["total_samples"] > 0, \
        "No samples evaluated"

    # Build output
    output = {
        "base_model": args.base_model,
        "adapter_path": args.adapter_path,
        "samples_evaluated": results["total_samples"],
        "overall_accuracy": results["overall_accuracy"],
        "by_type": results["by_type"],
        "predictions_sample": results["sample_predictions"],
    }

    # Write JSON
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nResults written to {args.output}")

    # Print summary
    print(f"\n{'='*60}")
    print(f"RSVQA-LR-2k | N={results['total_samples']} | "
          f"accuracy={results['overall_accuracy']:.4f} | "
          f"adapter={args.adapter_path or 'none'}")
    print(f"{'='*60}")
    print(f"By type:")
    for qtype, stats in results["by_type"].items():
        print(f"  {qtype:12s}: {stats['count']:4d} samples, "
              f"accuracy={stats['accuracy']:.4f}")


if __name__ == "__main__":
    main()
