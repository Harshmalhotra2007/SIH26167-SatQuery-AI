"""
train/train_qlora.py

Real QLoRA fine-tuning of Qwen2-VL-2B on BigEarthNet joined datasets (data/train_samples.jsonl).
Applies 4-bit NF4 quantization, LoRA adapters, oversamples captioning pairs 4x,
executes PyTorch training via HuggingFace Trainer, and asserts finite loss reduction.
"""

import os
import sys
import math
import json
import argparse
from typing import List, Dict, Any
from PIL import Image

# Ensure project root is in sys.path so 'train.collator' resolves cleanly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import torch
from torch.utils.data import Dataset
from transformers import (
    AutoProcessor,
    Qwen2VLForConditionalGeneration,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer,
    TrainerCallback
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from train.collator import MultimodalCollator


class BigEarthDataset(Dataset):
    """
    PyTorch Dataset wrapper for BigEarthNet QLoRA SFT training samples.
    """
    def __init__(self, samples: List[Dict[str, Any]]):
        self.items = []
        for s in samples:
            img_path = s["image_path"]
            if not os.path.exists(img_path):
                raise FileNotFoundError(f"Image path does not exist: {img_path}")
            
            image = Image.open(img_path).convert("RGB")
            self.items.append({
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "image"},
                        {"type": "text", "text": s["question"]}
                    ]
                }],
                "answer": s["answer"],
                "image": image
            })

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx):
        return self.items[idx]


class LossRecorderCallback(TrainerCallback):
    """
    Callback to log step loss values for trajectory assertion.
    """
    def __init__(self):
        self.loss_history: List[float] = []

    def on_log(self, args, state, control, logs=None, **kwargs):
        if logs and "loss" in logs:
            self.loss_history.append(float(logs["loss"]))


def parse_args():
    parser = argparse.ArgumentParser(description="Real QLoRA Fine-Tuning of Qwen2-VL-2B on BigEarthNet")
    parser.add_argument("--model-id", type=str, default="Qwen/Qwen2-VL-2B-Instruct", help="Base model ID")
    parser.add_argument("--data-path", type=str, default="data/train_samples.jsonl", help="Path to JSONL dataset")
    parser.add_argument("--output-dir", type=str, default="train/checkpoints", help="Output directory for checkpoints")
    parser.add_argument("--smoke-test", action="store_true", help="Run 30-step smoke test on 20 samples")
    parser.add_argument("--max-steps", type=int, default=500, help="Maximum training steps")
    return parser.parse_args()


def main():
    args = parse_args()
    print("=== Task 2: Real QLoRA Fine-Tuning (Qwen2-VL-2B-Instruct) ===")

    # 1. Verify dataset existence (no synthetic fallbacks)
    if not os.path.exists(args.data_path):
        raise FileNotFoundError(
            f"Dataset file '{args.data_path}' does not exist. "
            "Please run 'python train/build_dataset.py' first to build real training samples."
        )

    # Auto-detect precision for T4 (fp16) vs A100 (bf16) GPUs
    USE_BF16 = torch.cuda.is_available() and torch.cuda.is_bf16_supported()
    COMPUTE_DTYPE = torch.bfloat16 if USE_BF16 else torch.float16
    print(f"CUDA Available: {torch.cuda.is_available()} | Use BF16: {USE_BF16} | Compute Dtype: {COMPUTE_DTYPE}")

    # 2. Read samples & apply 4x oversampling for captioning
    print(f"Reading samples from {args.data_path}...")
    raw_samples = []
    with open(args.data_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                sample = json.loads(line)
                # Oversample captioning 4x for balanced training mix
                if sample.get("type") == "captioning":
                    raw_samples.extend([sample] * 4)
                else:
                    raw_samples.append(sample)

    print(f"Loaded {len(raw_samples)} samples (after 4x captioning oversampling).")

    # Handle smoke-test subset
    if args.smoke_test:
        raw_samples = raw_samples[:20]
        print(f"Smoke-test mode active: limited dataset to {len(raw_samples)} samples.")

    # 3. Build PyTorch dataset
    dataset = BigEarthDataset(raw_samples)

    # 4. Configure BitsAndBytes 4-bit NF4 Quantization
    print(f"Loading base model '{args.model_id}' in 4-bit NF4 quantization...")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=COMPUTE_DTYPE
    )

    processor = AutoProcessor.from_pretrained(args.model_id)
    processor.tokenizer.padding_side = "right"
    model = Qwen2VLForConditionalGeneration.from_pretrained(
        args.model_id,
        quantization_config=bnb_config,
        device_map="auto"
    )

    # 5. Prepare model for kbit training & apply LoRA
    model = prepare_model_for_kbit_training(model)
    lora_config = LoraConfig(
        r=8,
        lora_alpha=16,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # 6. Initialize MultimodalCollator & TrainingArguments
    collator = MultimodalCollator(processor=processor)
    max_steps = 30 if args.smoke_test else args.max_steps

    # transformers 5.x removed warmup_ratio; compute warmup_steps from the ratio
    warmup_steps = max(1, int(0.03 * max_steps))

    training_args = TrainingArguments(
        output_dir=args.output_dir,
        max_steps=max_steps,
        bf16=USE_BF16,
        fp16=not USE_BF16,
        optim="paged_adamw_8bit",
        gradient_checkpointing=True,
        gradient_checkpointing_kwargs={"use_reentrant": False},
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        lr_scheduler_type="cosine",
        warmup_steps=warmup_steps,
        logging_steps=1,
        save_steps=100,
        remove_unused_columns=False,
        report_to="none"
    )

    loss_recorder = LossRecorderCallback()

    # 7. Execute PyTorch Training Loop
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        data_collator=collator,
        callbacks=[loss_recorder]
    )

    print(f"Starting QLoRA training for {max_steps} steps...")
    trainer.train()

    # 8. Loss Trajectory Assertions
    losses = loss_recorder.loss_history
    print(f"\nTraining Loss Trajectory ({len(losses)} logged steps): {losses}")

    if not losses:
        raise RuntimeError("No loss values logged during training.")

    # Assert finite loss values
    if not all(math.isfinite(l) for l in losses):
        raise RuntimeError("Training failed: Non-finite (NaN or Inf) loss encountered in loss trajectory.")

    # Assert loss reduction (mean of last third < mean of first third)
    if len(losses) >= 3:
        third_len = len(losses) // 3
        first_third_mean = sum(losses[:third_len]) / third_len
        last_third_mean = sum(losses[-third_len:]) / third_len

        print(f"First-third mean loss: {first_third_mean:.4f} | Last-third mean loss: {last_third_mean:.4f}")

        if last_third_mean >= first_third_mean:
            raise RuntimeError(
                f"Loss trajectory assertion failed: Last third mean loss ({last_third_mean:.4f}) "
                f"did not decrease relative to first third mean loss ({first_third_mean:.4f})."
            )

    # 9. Save final LoRA adapter
    final_adapter_dir = os.path.join(args.output_dir, "final_adapter")
    print(f"Saving final LoRA adapter to {final_adapter_dir}...")
    model.save_pretrained(final_adapter_dir)
    processor.save_pretrained(final_adapter_dir)

    print("\n=== Task 2 Complete ===")
    print(f"LoRA adapter successfully saved to: {final_adapter_dir}")


if __name__ == "__main__":
    main()
