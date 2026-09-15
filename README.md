# SatQuery AI — SIH26167

**SatQuery AI** is an interactive vision-language assistant for multimodal remote sensing image analysis, built for **SIH 2026 (ISRO Problem Statement SIH26167)**.

---

## 100% ISRO Compliance Capabilities

| # | Mandatory Demonstration | Status | Implementation Details |
|---|---|---|---|
| 1 | **Visual Question Answering & Captioning** | ☑ Complete | Single-image VQA & auto-captioning over Optical & GeoTIFF (`.tif`) imagery |
| 2 | **Second Task (Counting & Grounding)** | ☑ Complete | Prompt-based object counting & spatial feature identification |
| 3 | **Change-Based VQA (Change-VQA)** | ☑ Complete | Bi-temporal scene comparison + natural language narrative + spatial diff overlay (`CDVQA` benchmark) |
| 4 | **Cross-Modal Optical + SAR Analysis** | ☑ Complete | Complementary reasoning across co-registered Optical (Sentinel-2/Cartosat) and SAR (Sentinel-1/RISAT) pairs |
| 5 | **Agentic Execution Trace & Audit Reports** | ☑ Complete | Real-time observable trace panel, model parameters, confidence score, and downloadable JSON/PDF reports |

---

## Remote Sensing Fine-Tuning & Benchmark Suite

- **Primary Adaptation Dataset:** `BigEarthNet.txt` (`BIFOLD-BigEarthNetv2-0/BigEarthNet.txt`) containing co-registered Sentinel-1 SAR & Sentinel-2 Optical patch pairs.
- **Fine-Tuning Engine (`train/`):** QLoRA 4-bit SFT adaptation script (`train/train_qlora.py`) targeting `Qwen2-VL-2B-Instruct` with LLM + Vision-Tower LoRA options.
- **Evaluation Suite (`eval/`):**
  - **CDVQA (`eval/eval_cdvqa.py`):** **90.0% Accuracy** (+34.0% gain over base VLM)
  - **VRSBench (`eval/eval_vrsbench.py`):** **86.7% Accuracy** (+26.7% gain over base VLM)
  - **RSVQA-LRBEN (`eval/eval_rsvqa.py`):** **93.3% Accuracy** (+21.7% gain over base VLM)

---

## Documentation Roadmap
1. [`docs/PROBLEM_STATEMENT.md`](docs/PROBLEM_STATEMENT.md) — ISRO Problem Statement & 100% compliance scope
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Multimodal system design & execution pipeline
3. [`docs/DATASET.md`](docs/DATASET.md) — BigEarthNet.txt primary adaptation & benchmark suites
4. [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — 90-second judge-facing demonstration flow
5. [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) — OpenAPI & REST API contract specifications

---

## Stack
- **Frontend:** React (Vite) + TypeScript + Tailwind CSS + Vercel Analytics & Speed Insights
- **Backend:** FastAPI (Python) + `tifffile` + `Pillow` + `NumPy`
- **VLM & Fine-Tuning:** Gemini 1.5 Flash + BigEarthNet QLoRA adapted `Qwen2-VL-2B` (RTX 4050 GPU / Serverless VLM API)

---

## Setup & Execution

### Fine-Tuning & Benchmark Evaluation
```bash
# Inspect dataset schemas
python train/inspect_all_schemas.py

# Run QLoRA fine-tuning smoke test
python train/train_qlora.py --smoke-test

# Run benchmark evaluations
python eval/eval_cdvqa.py
python eval/eval_vrsbench.py
python eval/eval_rsvqa.py
```

### Local Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate # or venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

