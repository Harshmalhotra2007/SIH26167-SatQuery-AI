# SatQuery AI â€” SIH26167

**SatQuery AI** is an interactive vision-language assistant for multimodal remote sensing image analysis, built for **SIH 2026 (ISRO Problem Statement SIH26167)**.

> **Note:** Earlier versions of this README contained placeholder benchmark numbers that were never measured. Those have been removed. All numbers currently shown are from real model runs on Kaggle T4 GPUs. Benchmark evaluation is pending.

---

## Status

| Capability | Status |
|---|---|
| Backend API (FastAPI) with image upload and VQA endpoints | âœ… Implemented |
| Frontend (React) with file upload and chat interface | âœ… Implemented |
| GeoTIFF/TIFF support via rasterio | âœ… Implemented |
| Multimodal collator for Qwen2-VL chat formatting | âœ… Implemented |
| BigEarthNet.txt join (2441 real Q&A pairs, 1000 Sentinel-2 images) | âœ… Implemented |
| QLoRA fine-tuning pipeline for Qwen2-VL-2B | âœ… Implemented |
| Smoke test (30 steps, 80.6% loss reduction) | âœ… Verified |
| Full fine-tune (400 steps, 2885 samples) | âœ… Complete â€” loss 2.67 â†’ 0.18 |
| RSVQA-LR-2k evaluation (2000 samples) | âœ… Complete â€” see docs/ADAPTATION.md |
| CDVQA evaluation | â³ Pending |
| Cross-modal (Optical + SAR) reasoning | â³ Pending |
| Change-based VQA | â³ Pending |
| Agentic execution trace in UI | âœ… Implemented |

---

## Remote Sensing Fine-Tuning (In Progress)

### Infrastructure Status
We have built complete infrastructure for BigEarthNet.txt adaptation:
- **Dataset loaders**: Schema-verified for `BIFOLD-BigEarthNetv2-0/BigEarthNet.txt` (text annotations)
- **Multimodal collator**: Production-ready with image-token alignment validation
- **QLoRA pipeline**: `train_qlora.py` supports 4-bit fine-tuning on Qwen2-VL-2B
- **GeoTIFF support**: `rasterio`-based loader for ISRO sensor data (Cartosat-2S, RISAT)

## Fine-Tuning Results

See `docs/ADAPTATION.md` for the full adaptation report.

**Smoke test** (30 steps, 20 samples):
- Initial loss: 3.074 â†’ Final loss: 0.281
- First-third mean: 1.528 â†’ Last-third mean: 0.296
- Loss reduction: 80.6%

**Full fine-tune** (400 steps, 2885 samples):
- Initial loss: 2.67 â†’ Final loss: 0.18
- First-third mean: 0.7482 â†’ Last-third mean: 0.3836
- Runtime: 34 minutes on Kaggle T4 Ã—2

**RSVQA-LR-2k benchmark** (2000-sample validation split):
- Base Qwen2-VL-2B-Instruct: 43.80%
- BigEarthNet-adapted (400 steps): 39.95%
- BigEarthNet-adapted (150 steps): 42.95%

Fine-tuning on BigEarthNet does not improve cross-domain accuracy on RSVQA-LR-2k. The adapter improves on the open-ended "other" category (+2.48 points) but loses on the "comparison" category, where the base model exploits a strong response prior. See `docs/ADAPTATION.md` for full analysis.

**Benchmark evaluation** (VRSBench, RSVQA, CDVQA): pending real measurement.

### Fine-Tuning Pipeline
```bash
# Inspect dataset schemas
python train/inspect_all_schemas.py

# Run QLoRA training (requires GPU + PyTorch + transformers + peft + trl + bitsandbytes)
python train/train_qlora.py --smoke-test
python train/train_qlora.py --steps 1000 --tune-vision-tower

# Evaluate on benchmarks (requires loaded model)
python eval/eval_cdvqa.py
python eval/eval_vrsbench.py
python eval/eval_rsvqa.py
```

---

## Documentation
1. [`docs/PROBLEM_STATEMENT.md`](docs/PROBLEM_STATEMENT.md) â€” ISRO Problem Statement & compliance scope
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) â€” Multimodal system design & execution pipeline
3. [`docs/DATASET.md`](docs/DATASET.md) â€” BigEarthNet.txt primary adaptation dataset
4. [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) â€” 90-second judge-facing demonstration flow
5. [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) â€” OpenAPI & REST API contract specifications

---

## Stack
- **Frontend:** React (Vite) + TypeScript + Tailwind CSS + Space Grotesk / DM Sans typography
- **Backend:** FastAPI (Python) + `tifffile` + `Pillow` + `NumPy` + `rasterio`
- **VLM:** Gemini 1.5 Flash (primary) + BigEarthNet QLoRA adapted Qwen2-VL-2B (fine-tuning pipeline ready)

---

## Setup & Execution

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Fine-Tuning (Requires GPU)
```bash
# Install training dependencies
pip install torch transformers peft trl bitsandbytes datasets

# Inspect datasets
python train/inspect_all_schemas.py

# Run smoke test (30 steps)
python train/train_qlora.py --smoke-test

# Full fine-tuning
python train/train_qlora.py --steps 1000
```

---

## Demo
Start both services and visit `http://localhost:5173`:
1. Upload a satellite image (PNG/JPG/TIFF)
2. Ask questions about land cover, buildings, vegetation
3. Switch to Change Detection tab and upload before/after pairs
4. Use Cross-Modal tab for Optical+SAR fusion analysis
5. View agentic execution traces and confidence scores in real-time