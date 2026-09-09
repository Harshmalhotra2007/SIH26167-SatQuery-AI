# SatQuery AI — SIH26167

Interactive vision-language assistant for remote sensing image analysis, built for SIH 2026 (ISRO — SIH26167).

## Docs (read in this order)
1. [`docs/PROBLEM_STATEMENT.md`](docs/PROBLEM_STATEMENT.md) — the ask + our locked MVP scope
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design
3. [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) — frontend↔backend contract (update this BEFORE changing endpoints)
4. [`docs/DATASET.md`](docs/DATASET.md) — datasets + curated demo images
5. [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — exact judge-facing demo flow

## Stack
- **Frontend:** React (Vite) + Tailwind
- **Backend:** FastAPI (Python)
- **VLM:** Gemini API (primary) + local Qwen2-VL-2B/Moondream2 (offline fallback, runs on RTX 4050)

## Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env       # then fill in GEMINI_API_KEY
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Status
- [ ] Backend skeleton
- [ ] VQA endpoint working (Gemini)
- [ ] Local fallback model working
- [ ] Change detection module
- [ ] Frontend UI
- [ ] Full integration
- [ ] Stretch: LoRA fine-tune
- [ ] Stretch: YOLOv8 counting overlay
- [ ] Demo rehearsed 3x
