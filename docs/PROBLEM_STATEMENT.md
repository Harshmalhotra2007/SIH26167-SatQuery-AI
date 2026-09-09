# SIH26167 — SatQuery AI

## Official Problem Statement
**Title:** SatQuery AI - An Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis through Text Queries
**Organization:** Indian Space Research Organisation (ISRO)
**Category:** Software
**Theme:** Space Technology

**Full ask (from ISRO):** Build a vision-language assistant that lets users query remote sensing imagery (optical, SAR, cross-modal, bi-temporal) using natural language, and get answers via visual question answering, captioning, grounding, and change analysis.

## Why full scope is NOT the target for this build
- Team has zero prior ML/DL experience.
- SAR imagery preprocessing and true cross-modal fusion are research-grade problems (see: LISAT, ChangeChat, DeltaVLM, GeoPilot — all recent published papers tackling this exact space). Attempting the full brief risks a half-working demo of everything instead of a solid demo of something.
- 15 days is enough for a strong, narrow MVP + one real differentiator — not enough to reproduce a research paper from scratch.

## Locked MVP Scope (v1)

### In scope
1. **Visual Question Answering** — upload an optical satellite/aerial image, ask a natural-language question, get an answer.
2. **Captioning** — auto-generate a descriptive caption for any uploaded image.
3. **Change Detection (the differentiator)** — upload two images of the same location (different times), get:
   - Visual diff overlay (highlighted changed regions)
   - Natural-language description of what changed
4. **Object counting** — prompt-based counting via VLM (e.g. "how many buildings/vehicles are visible").

### Explicitly OUT of scope for v1 (mention as future work in pitch)
- SAR imagery support
- True cross-modal (optical+SAR fused) reasoning
- Visual grounding with bounding-box output (unless Day 11–12 stretch goal is reached via YOLOv8)
- Real-time satellite feed ingestion

### Stretch goals (Day 11–12, only if core is done and stable)
- LoRA fine-tune of a small local VLM (e.g. Qwen2-VL-2B, 4-bit) on RSICD or similar RS captioning dataset — feasible on RTX 4050 (6GB VRAM) and would be a genuine differentiator vs. teams doing raw prompting only.
- YOLOv8 pretrained object detection overlay for the counting feature (real bounding boxes instead of just a VLM-guessed number).

## Target users (per ISRO framing)
Analysts / researchers who need quick, conversational insights from satellite imagery without manual GIS tooling.

## Success criteria for hackathon demo
- Judge can upload/select an image and get a coherent, relevant answer in under 5 seconds.
- Change detection demo is visually obvious (clear before/after + highlighted diff).
- System handles a bad/irrelevant image gracefully (no crash, no nonsense answer presented confidently).
