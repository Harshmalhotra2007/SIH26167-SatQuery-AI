# Demo Script — SatQuery AI (target: 90 seconds)

Fill in the blanks once DATASET.md's curated set is finalized. Rehearse this exact sequence at least 3 times before the actual demo — no live improvisation with untested images.

## Sequence

**[0:00–0:10] Hook**
"Analysts spend hours manually scanning satellite imagery. SatQuery AI lets you just ask."

**[0:10–0:30] VQA + Captioning**
- Upload demo image #1.
- Ask: "___________________" (pre-written question, tested to give a good answer)
- Show answer appears in chat.
- Click "auto-caption" → show caption.

**[0:30–0:60] Change Detection (the differentiator)**
- Upload before/after pair (demo image #3).
- Show diff overlay rendering.
- Read out the natural-language change description.
- Call out explicitly: "This is the part most teams tackling this problem won't build — most will only do basic Q&A."

**[0:60–0:80] Counting (+ stretch goal if ready)**
- Ask a counting question on demo image #4.
- If YOLOv8 stretch goal is done: show bounding boxes overlay.
- If LoRA fine-tune stretch goal is done: mention it explicitly — "we fine-tuned our own model on remote sensing data, this isn't just a wrapper on a general-purpose API."

**[0:80–0:90] Close**
"Built for ISRO's exact ask — vision-language Q&A over remote sensing imagery — with change detection as our core differentiator. Future work: SAR imagery and cross-modal fusion, as outlined in the original problem statement."

## Fallback plan
- If live internet fails: switch to local model — should be seamless since both are behind the same `vlm_service.ask()` interface (see ARCHITECTURE.md). Practice this switch too.
- If a live demo call fails entirely: have a 60-second screen recording as backup, ready to play instantly.

## Pre-demo checklist
- [ ] All 4 demo images tested end-to-end that morning (not days before — models/APIs can drift)
- [ ] Local fallback model tested working offline
- [ ] Laptop fully charged + charger packed
- [ ] Screen recording backup ready
- [ ] Pitch deck has architecture diagram from ARCHITECTURE.md
