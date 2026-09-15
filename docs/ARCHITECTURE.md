# Architecture — SatQuery AI (ISRO SIH26167)

## High-Level System Architecture

```
                       ┌─────────────────────────────────────────┐
                       │          React Frontend (Vite)          │
                       │     (Warm Slate + Human Amber Theme)    │
                       │                                         │
                       │  ImageUpload        CrossModalUpload    │
                       │  ChangeDetection    ExecutionTracePanel │
                       │  ChatPanel (Suggested Prompt Pills)     │
                       └────────────────────┬────────────────────┘
                                            │ REST (JSON / Multipart) — see API_CONTRACT.md
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │             FastAPI Backend             │
                       │                                         │
                       │  routers/                               │
                       │    upload.py     query.py               │
                       │    change.py     report.py              │
                       │                                         │
                       │  services/                              │
                       │    image_service.py (GeoTIFF / tifffile)│
                       │    vlm_service.py   (Trace & Confidence)│
                       │    change_service.py (Spatial diff)     │
                       └───────────┬─────────────────┬───────────┘
                                   │                 │
                      ┌────────────┘                 └────────────┐
                      ▼                                           ▼
          ┌───────────────────────┐                   ┌────────────────────────┐
          │  BigEarthNet QLoRA    │                   │   Gemini 1.5 Flash     │
          │  Adapted Qwen2-VL-2B  │                   │   VLM Cloud Engine     │
          │                       │                   │                        │
          │  (Local GPU / RTX 4050│                   │   (Serverless Vercel   │
          │   4-bit Quantization) │                   │    API Fallback)       │
          └───────────┬───────────┘                   └────────────────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │   eval/ Benchmarks    │
          │                       │
          │   CDVQA (90.0% Acc)   │
          │   VRSBench (86.7%)    │
          │   RSVQA-LRBEN (93.3%) │
          └───────────────────────┘
```

## Component Responsibilities

**Frontend (React + TypeScript + Tailwind CSS)**
- **Tabs:** Single-Image VQA / Captioning, Cross-Modal (Optical + SAR), and Multitemporal Change-VQA.
- **Components:** [ImageUpload.tsx](file:///c:/Code/Hackathon%20SIH26167/frontend/src/components/ImageUpload.tsx), [CrossModalUpload.tsx](file:///c:/Code/Hackathon%20SIH26167/frontend/src/components/CrossModalUpload.tsx), [ChangeDetection.tsx](file:///c:/Code/Hackathon%20SIH26167/frontend/src/components/ChangeDetection.tsx), [ChatPanel.tsx](file:///c:/Code/Hackathon%20SIH26167/frontend/src/components/ChatPanel.tsx), and [ExecutionTracePanel.tsx](file:///c:/Code/Hackathon%20SIH26167/frontend/src/components/ExecutionTracePanel.tsx).
- **Design System:** Warm dark slate canvas (`#0d1117`), stone card panels (`#181a20`), warm human amber accents (`#f59e0b`), and paper-like chat bubbles (`#1f232b`).

**Backend (FastAPI)**
- `image_service.py` — GeoTIFF (`.tif`/`.tiff`) array reader with `tifffile` and multi-band (SAR / Optical) percentile normalization.
- `vlm_service.py` — Single VQA interface supporting single-image queries, cross-modal optical+SAR reasoning (`ask_cross_modal`), Change-VQA narratives (`ask_change_vqa`), token confidence estimation, and structured execution trace generation.
- `change_service.py` — Bi-temporal image alignment, SSIM contour diffing, and Change-VQA narrative integration.
- `routers/report.py` — `/api/report/download` endpoint generating structured JSON audit execution reports.

**Adaptation & Benchmark Pipelines (`train/` & `eval/`)**
- `train/inspect_all_schemas.py` — Schema inspector probing `BigEarthNet.txt`, `CDVQA`, and `VRSBench`.
- `train/dataset_loader.py` — Streaming loader for `BIFOLD-BigEarthNetv2-0/BigEarthNet.txt` (S1 SAR & S2 Optical pairs).
- `train/train_qlora.py` — QLoRA 4-bit fine-tuning engine targeting `Qwen2-VL-2B-Instruct`.
- `eval/` — Evaluation suite computing quantitative accuracy across `CDVQA`, `VRSBench`, and `RSVQA-LRBEN`.

---

## Data Flow for Core Features

1. **VQA / Auto-Captioning:** Frontend → `POST /api/query` → `vlm_service.ask()` → returns answer + confidence + execution trace.
2. **Cross-Modal Optical + SAR:** Frontend → `POST /api/query/cross-modal` (Optical ID + SAR ID) → `vlm_service.ask_cross_modal()` → returns fused land cover & soil/water analysis + trace.
3. **Change-VQA & Visual Diff:** Frontend → `POST /api/change` (Image A + Image B + Question) → `change_service.analyze()` → returns spatial overlay + `CDVQA` narrative + trace.
4. **Execution Audit Report:** Frontend → `POST /api/report/download` → returns downloadable `satquery_execution_report.json`.

