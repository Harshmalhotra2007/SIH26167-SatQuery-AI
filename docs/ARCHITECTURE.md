# Architecture - SatQuery AI (ISRO SIH26167)

## High-Level System Architecture

SatQuery AI is a three-tier web application:

1. **Frontend (React + Vite + Tailwind)** - interactive UI for upload, query, and result display
2. **Backend (FastAPI)** - routing, image handling, VLM dispatch, execution tracing
3. **VLM Backend** - Gemini 1.5 Flash by default; local Qwen2-VL-2B with the BigEarthNet LoRA adapter as an offline alternative

```
+------------------+        +---------------------+        +--------------------+
|  User (browser)  | <----> |  FastAPI backend    | <----> |  VLM backend       |
|  React frontend  |  HTTP  |  /upload /query     |  SDK   |  Gemini 1.5 Flash  |
+------------------+        |  /change /report    |        |  (or local Qwen2)  |
                            +---------------------+        +--------------------+
                                     |
                                     v
                            +---------------------+
                            |  Static files       |
                            |  (uploads, diffs)   |
                            +---------------------+
```

---

## Component Responsibilities

### Backend Routers (backend/app/routers/)

| Router | Endpoints | Purpose |
|---|---|---|
| upload.py | POST /upload | Accepts GeoTIFF/TIFF/PNG/JPEG, saves to disk, returns image_id |
| query.py | POST /query, POST /query/cross-modal | Single-image VQA and optical+SAR joint analysis |
| change.py | POST /change | Bi-temporal diff and change VQA |
| report.py | POST /report/download | Exports execution audit summaries as JSON |

### Backend Services (backend/app/services/)

| Service | Purpose |
|---|---|
| image_service.py | Loads GeoTIFF (via rasterio), converts multi-band to RGB, normalizes per-band |
| vlm_service.py | Dispatches to Gemini 1.5 Flash; falls back to local Qwen2-VL-2B if cloud is unavailable. Labels the responding model honestly. |
| change_service.py | OpenCV-based spatial diff and change mask generation |

### Training Pipeline (train/)

The fine-tuning pipeline is separate from the deployed backend. It runs offline on Kaggle T4 x2 GPUs.

```
data/train_samples.jsonl   --->   train/train_qlora.py   --->   train/checkpoints/final_adapter/
   (2441 Q&A pairs)               (QLoRA 4-bit SFT)                (36.9 MB LoRA adapter)
```

| File | Purpose |
|---|---|
| build_dataset.py | Joins BigEarthNet.txt Q&A with Sentinel-2 images by patch_id |
| collator.py | Multimodal collator for Qwen2-VL chat formatting and label masking |
| train_qlora.py | QLoRA fine-tuning loop |
| dataset_loader.py | Streaming loader for BigEarthNet.txt |

Result: loss reduced from 1.87 to 0.20 over 400 optimizer steps. Full report in docs/ADAPTATION.md.

### Evaluation Pipeline (eval/)

| File | Benchmark | Status |
|---|---|---|
| eval_rsvqa.py | RSVQA-LR-2k (2000 samples) | Complete - see docs/ADAPTATION.md |

Result: base Qwen2-VL-2B 43.80%, BigEarthNet-adapted 39.95% (400 steps) / 42.95% (150 steps). Cross-domain transfer does not improve overall RSVQA accuracy; the adapter improves on the open-ended "other" category. Full analysis in docs/ADAPTATION.md.

---

## Data Flow for Core Features

### Single-Image VQA

1. User uploads an image via /upload. Backend stores it and returns image_id.
2. Frontend sends image_id and question to /query.
3. Backend loads the image, dispatches to Gemini 1.5 Flash (or local Qwen2-VL-2B on failure).
4. Response includes the model answer, the model label, and the execution trace.
5. Frontend displays the answer and trace in the chat panel.

### Cross-Modal Optical + SAR

1. User uploads two images - optical and SAR - via two /upload calls.
2. Frontend sends both image_ids and the question to /query/cross-modal.
3. Backend loads both images and passes them to the VLM in a single multi-image prompt.
4. Response includes the fused analysis and an execution trace listing both loader tools.

### Change VQA

1. User uploads two images of the same area at different times.
2. Frontend sends both files and the question to /change.
3. Backend runs the OpenCV diff engine (produces a change mask and change percentage) and separately asks the VLM to describe the change in natural language.
4. Response includes the diff overlay URL, the model description, the change percentage, and the execution trace.

### Execution Trace

Every /query, /query/cross-modal, and /change response includes an execution_trace object:

- selected_task - which specialist workflow the router chose
- model_used - actual backend that served the request
- tools_invoked - list of tools run
- parameters - task-specific settings
- execution_time_ms - wall-clock latency

The trace is rendered in the frontend ExecutionTracePanel component and included in the downloadable report.

---

## File Layout

```
SIH26167-SatQuery-AI/
  backend/
    app/
      routers/
      services/
      models/
    tests/
    requirements.txt
  frontend/
    src/
      components/
      api/
  train/
    train_qlora.py
    collator.py
    build_dataset.py
    checkpoints/
      final_adapter/
  eval/
    eval_rsvqa.py
  docs/
    ADAPTATION.md
    API_CONTRACT.md
    ARCHITECTURE.md
    DATASET.md
    DEMO_SCRIPT.md
    PROBLEM_STATEMENT.md
  README.md
```

---

## What the Adapter Is and Is Not

Is: a LoRA adapter trained on 2,441 BigEarthNet Q&A pairs using QLoRA 4-bit on Qwen2-VL-2B. It is loaded when the local backend is selected. It has been evaluated on RSVQA-LR-2k; results are in docs/ADAPTATION.md.

Is not: the default production backend. Production uses Gemini 1.5 Flash for latency and coverage reasons. The adapter is available as an offline alternative and as the artifact used in the evaluation section of the submission.