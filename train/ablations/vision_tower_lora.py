from dataclasses import dataclass
from transformers import Qwen2_5_VLForConditionalGeneration, Qwen2_5_VLProcessor
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer
from transformers import TrainingArguments
import torch

from collator import MultimodalCollator


MODEL_ID = "Qwen/Qwen2.5-VL-7B-Instruct"
DEVICE = "cuda"

# Variant B: include vision tower in LoRA targets
lora_cfg_vision = LoraConfig(
    r=8,
    lora_alpha=16,
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
        # Qwen2.5-VL vision blocks — verify exact module names with:
        # model = Qwen2_5_VLForConditionalGeneration.from_pretrained(MODEL_ID)
        # print([n for n, _ in model.named_modules() if "visual" in n][:20])
        # Then uncomment and adjust the lines below to match your build
        # "visual.blocks.23.attn.qkv",
        # "visual.blocks.23.attn.proj",
        # "visual.blocks.23.mlp.fc1",
        # "visual.blocks.23.mlp.fc2",
    ],
)

# Usage: run the same 30-step smoke test with this config.
# Compare final loss to LLM-only LoRA.
# If vision-tower variant converges to lower loss, use it as default.
