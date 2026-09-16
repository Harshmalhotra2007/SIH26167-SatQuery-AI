from pathlib import Path
import os
import math
from dataclasses import dataclass
from datasets import load_dataset
from transformers import (
    Qwen2_5_VLProcessor,
    Qwen2_5_VLForConditionalGeneration,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer
import torch

from data.loaders import load_dataset_safe
from collator import MultimodalCollator


# --- Config ---
MODEL_ID = os.environ.get("MODEL_ID", "Qwen/Qwen2.5-VL-7B-Instruct")
BIGEARTH_PATH = os.environ.get("BIGEARTH_PATH", "<verified_path>")
DEVICE = "cuda"


# --- Load 10 samples via streaming ---
ds = load_dataset_safe(BIGEARTH_PATH, streaming=True).take(10)
samples = list(ds)
print(f"Loaded {len(samples)} samples")

# --- Inspect schema ---
ex = samples[0]
print("Keys:", list(ex.keys()))
assert any(k in ex for k in ("image", "patch", "img")), "No image field found in schema"
print("Schema OK")


# --- Processor + image-token checks ---
processor = Qwen2_5_VLProcessor.from_pretrained(MODEL_ID)
assert processor.tokenizer.padding_side == "right", (
    f"Expected right padding, got {processor.tokenizer.padding_side}"
)

# Single image
msgs1 = [{"role": "user", "content": [
    {"type": "image"},
    {"type": "text", "text": "Describe this image."},
]}]
text1 = processor.apply_chat_template(msgs1, tokenize=False, add_generation_prompt=True)
assert text1.count("<|vision_start|>") == 1, (
    f"Expected 1 <|vision_start|>, got {text1.count('<|vision_start|>')}"
)
print("Single-image token placement OK")

# Multi-image (for CDVQA bitemporal)
msgs2 = [{"role": "user", "content": [
    {"type": "text", "text": "Image 1 (before):"},
    {"type": "image"},
    {"type": "text", "text": "Image 2 (after):"},
    {"type": "image"},
    {"type": "text", "text": "What changed?"},
]}]
text2 = processor.apply_chat_template(msgs2, tokenize=False, add_generation_prompt=True)
assert text2.count("<|vision_start|>") == 2, (
    f"Expected 2 <|vision_start|>, got {text2.count('<|vision_start|>')}"
)
print("Multi-image token placement OK")


# --- Collator ---
collator = MultimodalCollator(processor)


# --- Build training samples ---
def build_sample(ex):
    img_field = next(k for k in ("image", "patch", "img") if k in ex)
    answer = ex.get("caption") or ex.get("answer") or ex.get("label_text")
    if answer is None:
        raise ValueError(
            f"No answer field found. Keys present: {list(ex.keys())}. "
            "Update build_sample to match the real schema."
        )
    return {
        "messages": [{"role": "user", "content": [
            {"type": "image"},
            {"type": "text", "text": "Describe this satellite image."},
        ]}],
        "answer": answer,
        "image": ex[img_field],
    }


batch = collator([build_sample(ex) for ex in samples[:4]])
print(f"input_ids:    {batch['input_ids'].shape}")
print(f"pixel_values: {batch['pixel_values'].shape}")
print(f"labels:       {batch['labels'].shape}")


# --- Alignment check: hard-fail, no skipping ---
image_pad_id = processor.tokenizer.convert_tokens_to_ids("<|image_pad|>")
assert image_pad_id != processor.tokenizer.unk_token_id, (
    "<|image_pad|> is not a special token — check tokenizer"
)

num_image_pads = (batch["input_ids"] == image_pad_id).sum().item()
assert num_image_pads > 0, "No <|image_pad|> tokens found in input_ids"

grid_thw = batch.get("image_grid_thw")
assert grid_thw is not None, (
    "image_grid_thw missing from batch — processor config is wrong"
)

merge_size = processor.image_processor.merge_size
expected_visual = int((grid_thw.prod(dim=1) / (merge_size ** 2)).sum().item())
assert num_image_pads == expected_visual, (
    f"Image token misalignment: {num_image_pads} pads vs "
    f"{expected_visual} expected visual tokens"
)
print(f"Alignment OK: {num_image_pads} pads == {expected_visual} visual tokens")


# --- Label masking checks ---
labels0 = batch["labels"][0]
assert labels0[0] == -100, "First prompt token not masked"
assert (labels0 != -100).any(), "No assistant tokens unmasked — nothing to train on"

eos_id = processor.tokenizer.eos_token_id
if eos_id is not None:
    assert (labels0 == eos_id).any(), "No EOS token in labels — model will not learn to stop"

non_masked = (labels0 != -100).sum().item()
total = labels0.numel()
print(f"Unmasked tokens: {non_masked} / {total} ({non_masked/total:.1%})")
print("Label masking OK")


# --- 30-step smoke training run ---
print("\nStarting 30-step smoke run...")

lora_cfg = LoraConfig(
    r=8,
    lora_alpha=16,
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
)

model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
    MODEL_ID,
    device_map="auto",
    torch_dtype=torch.bfloat16,
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
)
model = prepare_model_for_kbit_training(model)
model = get_peft_model(model, lora_cfg)

train_ds = [build_sample(ex) for ex in samples[:8]]

trainer = SFTTrainer(
    model=model,
    args=TrainingArguments(
        output_dir="/tmp/smoke",
        max_steps=30,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        logging_steps=1,
        bf16=True,
        optim="paged_adamw_8bit",
        gradient_checkpointing=True,
        report_to="none",
    ),
    train_dataset=train_ds,
    data_collator=MultimodalCollator(processor),
)
trainer.train()

# Assert loss is finite and trending down
history = trainer.state.log_history
losses = [h["loss"] for h in history if "loss" in h]
assert all(math.isfinite(l) for l in losses), "Non-finite loss — check LR, precision, or data"
n = len(losses)
early = sum(losses[: n // 3]) / max(1, n // 3)
late = sum(losses[-n // 3 :]) / max(1, n // 3)
assert late < early * 0.98, (
    f"Loss did not improve: early={early:.4f} late={late:.4f}"
)
print(f"Loss trajectory: {early:.4f} -> {late:.4f}")
print("Smoke run complete — pipeline is functional")
