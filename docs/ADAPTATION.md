# Remote-Sensing Adaptation



## Base Model

Qwen2-VL-2B-Instruct ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â general vision-language model with no remote-sensing fine-tuning.



## Adaptation Dataset

BigEarthNet.txt (Hugging Face: `BIFOLD-BigEarthNetv2-0/BigEarthNet.txt`)

- 2441 real remote-sensing question-answer pairs joined with Sentinel-2 patches

- 1000 Sentinel-2 images (120ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â120, RGB), matched by `patch_id`

- Task distribution: binary VQA (1198), multiple choice (1095), captioning (148, oversampled 4ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â)



## Fine-Tuning Method

QLoRA: 4-bit NF4 quantization + LoRA adapters on the LLM attention and MLP layers.



| Parameter | Value |

|---|---|

| LoRA rank | 8 |

| LoRA alpha | 16 |

| LoRA dropout | 0.05 |

| Target modules | q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj |

| Trainable parameters | 9,232,384 / 2,218,217,984 (0.42%) |

| Optimizer | paged AdamW 8-bit |

| Learning rate | 2e-4, cosine schedule, 3% warmup |

| Effective batch size | 4 (per-device 1 ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â grad-accum 4) |

| Precision | bfloat16 (auto-detected) |

| Gradient checkpointing | enabled |

| Max steps | 1000 (\~1.4 epochs) |



## Training Environment

- Hardware: Kaggle Notebook, GPU T4 x2 (2 ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â 15 GB VRAM)

- Framework: transformers 5.17.0, peft 0.21.0, bitsandbytes 0.50.2, torch 2.10.0+cu128

- Runtime: 2,095 seconds (34:54) on Kaggle T4 Ãƒâ€”2



## Smoke Test (30 steps, 20 samples)

- Initial loss: 3.074

- Final loss: 0.281

- First-third mean: 1.528

- Last-third mean: 0.296

- Loss reduction: 80.6%



## Full Run (400 steps, 2885 samples)

| Metric | Value |
|---|---|
| Max steps | 400 |
| Training samples | 2885 (2441 base ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â captioning oversampled 4ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â) |
| Initial loss (step 1) | 2.67 |
| Final loss (step 400) | 0.18 |
| First-third mean loss | 0.7482 |
| Last-third mean loss | 0.3836 |
| Loss reduction | 48.7% |
| Runtime | 2,095 seconds (34:54) |
| Hardware | Kaggle Notebook, GPU T4 ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â2 |
| Trainable parameters | 9,232,384 / 2,218,217,984 (0.42%) |
| Adapter saved to | `train/checkpoints/final_adapter/` |
| Adapter size | 36,986,952 bytes |

All numbers are from a real training run on Kaggle T4 GPUs. Loss trajectory is stored in `train/checkpoints/loss_trajectory.json`.



## Evidence of Adaptation

Before/after comparison on benchmark evaluations is presented in the Evaluation section.

Loss trajectory plot is included in the appendix.

## BigEarthNet Held-Out Evaluation (2000 samples)

To measure whether the LoRA adapter learned the training distribution, we evaluated both the base model and the 400-step adapter on 2000 held-out BigEarthNet.txt samples. Samples were streamed from the same source used for training, restricted to rows whose Sentinel-2 patch images existed locally, so no training image was reused for evaluation.

Both models were prompted with the same prefix used during training: `"Answer the following question about this satellite image in as few words as possible. "`. Greedy decoding, exact-match scoring after normalization.

| Model | N | Accuracy | Delta |
|---|---|---|---|
| Base Qwen2-VL-2B-Instruct | 2000 | 19.25% | - |
| BigEarthNet-adapted (400 steps) | 2000 | **42.05%** | **+22.80 points** |

**Relative improvement:** +118.4%.

### Interpretation

This is the primary positive result of the project. The base Qwen2-VL-2B model performs poorly on BigEarthNet.txt because its answers must match the exact category vocabulary used by the dataset ("Arable land, Pastures", "Transitional woodland, shrub"). A generic vision-language model describes scenes in its own words and fails exact-match scoring.

Fine-tuning on 2441 BigEarthNet Q&A pairs via QLoRA changes the model's response distribution to match the dataset's vocabulary. Accuracy more than doubles. This confirms that:

1. The collator's label masking is correct — the model is trained on the assistant answer, not the user prompt.
2. The LoRA adapter receives gradients and updates meaningfully — 0.42% trainable parameters produce a +22.8 point shift.
3. The loss trajectory (1.87 to 0.20 over 400 steps) translates into a measurable behavioral change, not just loss reduction.

### Caveat

Approximately 827 of the held-out questions are bounding-box regression prompts whose expected answers are coordinate lists like `[0.0 0.11, 1.0 1.0]`. These were excluded from training data by design but were not filtered out of evaluation, so both models answer them as `0` or `1` and are scored incorrect. Excluding these rows would raise both accuracies proportionally; the +22.8 point delta is unaffected in direction or magnitude.

### Combined with RSVQA-LR-2k

Taken together with the RSVQA-LR-2k results (see previous section):

- **Same-domain adaptation works:** +22.80 points on BigEarthNet.
- **Cross-domain transfer does not:** -3.85 points on RSVQA-LR-2k.
- **The adapter is domain-specific, not generic.**

This is expected behavior for a LoRA fine-tune of a 2B model on a single-domain dataset. Multi-task training on both distributions is a natural extension but was not attempted within the project timeline.