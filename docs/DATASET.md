# Dataset & Demo Imagery — SatQuery AI

## Purpose of this file
Track exactly which images/datasets are used for (a) any fine-tuning experiment and (b) the curated judge-facing demo. Do not rely on judges uploading their own images during the live demo — always have known-good images ready.

## Public datasets (for stretch-goal fine-tuning / testing)
| Dataset | Use case | Notes |
|---|---|---|
| RSICD (Remote Sensing Image Captioning Dataset) | Captioning fine-tune | ~10k images, 5 captions each — good size for a LoRA fine-tune on 6GB VRAM |
| UCM Captions | Captioning fine-tune (smaller alt.) | Smaller than RSICD, faster iteration |
| ISRO Bhuvan | Realistic India-specific imagery for demo | Aligns with ISRO sponsor — use for at least 1–2 demo images |
| LEVIR-CD | Change detection testing | Bi-temporal building change pairs — good for validating change_service.py |
| xView / DOTA | Object counting/detection testing | If YOLOv8 stretch goal is attempted |

## Curated demo set (fill in as you select images)
| # | Image(s) | Feature demoed | Source | Verified working? |
|---|---|---|---|---|
| 1 | TBD | VQA — basic scene Q&A | | ☐ |
| 2 | TBD | Captioning | | ☐ |
| 3 | TBD (before/after pair) | Change detection | LEVIR-CD or Bhuvan | ☐ |
| 4 | TBD | Object counting | | ☐ |

**Rule:** an image only goes into the demo set once it has been run through the actual pipeline and produces a coherent answer — not just visually picked.

## Licensing note
RSICD, UCM, LEVIR-CD are research datasets — fine for hackathon/demo use with attribution. Confirm Bhuvan's terms of use before including its imagery in any public repo/deck.
