# Architecture — SatQuery AI

## High-level flow

```
                       ┌─────────────────────┐
                       │   React Frontend     │
                       │  (Vite + Tailwind)   │
                       │                       │
                       │  ImageUpload          │
                       │  ImageViewer          │
                       │  ChatWindow           │
                       │  QueryInput           │
                       └──────────┬────────────┘
                                  │ REST (JSON) — see API_CONTRACT.md
                                  ▼
                       ┌─────────────────────┐
                       │  FastAPI Backend      │
                       │                       │
                       │  routers/             │
                       │    upload.py          │
                       │    query.py           │
                       │                       │
                       │  services/            │
                       │    image_service.py   │──────┐
                       │    vlm_service.py     │      │ OpenCV
                       │    change_service.py  │      │ (align, diff, SSIM)
                       └──────┬───────┬────────┘      │
                              │       │                │
                 ┌────────────┘       └──────────┐     │
                 ▼                                ▼     │
        ┌─────────────────┐            ┌──────────────────┐
        │  Gemini Vision   │            │  Local VLM        │
        │  API (primary)   │            │  Qwen2-VL-2B /     │
        │                  │            │  Moondream2        │
        │  Cloud, fast,    │            │  (4-bit, offline    │
        │  needs internet  │            │  fallback, runs on  │
        │                  │            │  RTX 4050 6GB)      │
        └─────────────────┘            └──────────────────┘
```

## Component responsibilities

**Frontend (React + Vite)**
- Image upload (single + dual for change detection)
- Displays image with optional overlay (diff highlight / bounding boxes)
- Chat-style Q&A panel
- Calls backend only — no direct model calls from frontend

**Backend (FastAPI)**
- `image_service.py` — validation, resizing, format normalization, OpenCV-based diffing for change detection
- `vlm_service.py` — single interface (`ask(image, question) -> answer`) that internally routes to Gemini API first, falls back to local model if API fails/times out/no internet
- `change_service.py` — orchestrates: align two images → diff → crop changed region → send crop + prompt to vlm_service → return overlay + text
- `routers/` — thin HTTP layer only, no business logic

**Model layer**
- **Primary:** Gemini 1.5/2.0 Flash via API — used for demo reliability and speed.
- **Fallback/offline:** Qwen2-VL-2B or Moondream2, 4-bit quantized, run locally on the RTX 4050. Also the base model for the Day 11–12 LoRA fine-tune stretch goal.
- Both are accessed through the *same* `vlm_service.ask()` interface so switching is invisible to the rest of the app.

## Data flow for each feature

1. **VQA/Captioning:** Frontend → `POST /api/query` → `vlm_service.ask(image, question)` → answer returned.
2. **Change detection:** Frontend → `POST /api/change` → `image_service.align_and_diff(img1, img2)` → cropped diff region → `vlm_service.ask(crop, "describe what changed")` → `{overlay_image_url, description}` returned.
3. **Counting:** Frontend → `POST /api/query` with a counting-style question → routed to `vlm_service.ask()` (v1) or YOLOv8 detector (stretch goal) → count + optional boxes returned.

## Why this shape
- Swapping Gemini ↔ local model is a one-line change in `vlm_service.py` — protects the demo if venue wifi is unreliable.
- Business logic lives in `services/`, not `routers/`, so it's testable without spinning up the whole API.
- Frontend never talks to the model directly — keeps API keys server-side only.
