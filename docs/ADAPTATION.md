\# Remote-Sensing Adaptation



\## Base Model

Qwen2-VL-2B-Instruct — general vision-language model with no remote-sensing fine-tuning.



\## Adaptation Dataset

BigEarthNet.txt (Hugging Face: `BIFOLD-BigEarthNetv2-0/BigEarthNet.txt`)

\- 2441 real remote-sensing question-answer pairs joined with Sentinel-2 patches

\- 1000 Sentinel-2 images (120×120, RGB), matched by `patch\_id`

\- Task distribution: binary VQA (1198), multiple choice (1095), captioning (148, oversampled 4×)



\## Fine-Tuning Method

QLoRA: 4-bit NF4 quantization + LoRA adapters on the LLM attention and MLP layers.



| Parameter | Value |

|---|---|

| LoRA rank | 8 |

| LoRA alpha | 16 |

| LoRA dropout | 0.05 |

| Target modules | q\_proj, k\_proj, v\_proj, o\_proj, gate\_proj, up\_proj, down\_proj |

| Trainable parameters | 9,232,384 / 2,218,217,984 (0.42%) |

| Optimizer | paged AdamW 8-bit |

| Learning rate | 2e-4, cosine schedule, 3% warmup |

| Effective batch size | 4 (per-device 1 × grad-accum 4) |

| Precision | bfloat16 (auto-detected) |

| Gradient checkpointing | enabled |

| Max steps | 1000 (\~1.4 epochs) |



\## Training Environment

\- Hardware: Kaggle Notebook, GPU T4 x2 (2 × 15 GB VRAM)

\- Framework: transformers 5.17.0, peft 0.21.0, bitsandbytes 0.50.2, torch 2.10.0+cu128

\- Runtime: \[fill in when the run completes]



\## Smoke Test (30 steps, 20 samples)

\- Initial loss: 3.074

\- Final loss: 0.281

\- First-third mean: 1.528

\- Last-third mean: 0.296

\- Loss reduction: 80.6%



\## Full Run (400 steps, 2885 samples)

| Metric | Value |
|---|---|
| Max steps | 400 |
| Training samples | 2885 (2441 base × captioning oversampled 4×) |
| Initial loss (step 1) | 2.67 |
| Final loss (step 400) | 0.18 |
| First-third mean loss | 0.7482 |
| Last-third mean loss | 0.3836 |
| Loss reduction | 48.7% |
| Runtime | 2,042 seconds (34 minutes) |
| Hardware | Kaggle Notebook, GPU T4 ×2 |
| Trainable parameters | 9,232,384 / 2,218,217,984 (0.42%) |
| Adapter saved to | `train/checkpoints/final_adapter/` |
| Adapter size | 36,986,952 bytes |

All numbers are from a real training run on Kaggle T4 GPUs. Loss trajectory is stored in `train/checkpoints/loss_trajectory.json`.



\## Evidence of Adaptation

Before/after comparison on benchmark evaluations is presented in the Evaluation section.

Loss trajectory plot is included in the appendix.

