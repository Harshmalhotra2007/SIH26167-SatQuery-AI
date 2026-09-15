# SIH26167 — SatQuery AI

## Official Problem Statement
**Title:** SatQuery AI - An Interactive Vision-Language Assistant for Multimodal Remote Sensing Image Analysis through Text Queries
**Organization:** Indian Space Research Organisation (ISRO)
**Category:** Software
**Theme:** Space Technology

**Full Ask (from ISRO):** Build an interactive vision-language assistant that lets users query remote sensing imagery (optical, SAR, cross-modal, bi-temporal) using natural language, producing text answers, visual question answering, captioning, change descriptions, cross-modal fusion, and observable execution traces.

---

## 100% SIH Compliance Scope

### All 5 Mandatory ISRO Demonstrations (In Scope):
1. **Visual Question Answering & Auto-Captioning** — Upload optical or GeoTIFF/TIFF imagery, ask questions, or generate descriptive natural-language captions.
2. **Second Single-Image Task (Counting & Grounding)** — Prompt-based object counting and spatial feature identification across optical and SAR imagery.
3. **Change-Based Visual Question Answering (Change-VQA)** — Upload bi-temporal image pairs (Date A & Date B) + natural language questions to obtain conversational answers describing what changed alongside visual diff overlays.
4. **Cross-Modal Reasoning (Optical + SAR)** — Input co-registered optical (e.g. Sentinel-2 / Cartosat-2S) and SAR (e.g. Sentinel-1 / RISAT) image pairs to extract complementary land cover and soil/water structure information.
5. **Agentic Orchestration & Observable Execution Trace** — Real-time display of tool selection, model parameters, confidence estimation, and downloadable PDF/JSON execution reports.

---

## Technical Architecture & Fine-Tuning
- **Primary Adaptation Dataset:** `BigEarthNet.txt` (`BIFOLD-BigEarthNetv2-0/BigEarthNet.txt`) containing co-registered Sentinel-1 SAR & Sentinel-2 Optical multi-label patch pairs.
- **Fine-Tuning Pipeline (`train/`):** QLoRA 4-bit adaptation (`Qwen2-VL-2B-Instruct`) for remote sensing domain alignment.
- **Benchmark Evaluation (`eval/`):** Quantitative evaluation on `CDVQA`, `VRSBench`, and `RSVQA-LRBEN`.
- **Supported Formats:** GeoTIFF/TIFF (`rasterio`/`tifffile`), PNG, JPEG.

---

## Target Users (ISRO Framing)
ISRO/SAC Remote Sensing Analysts, GIS researchers, disaster management teams, and urban planners requiring conversational, multimodal insights without manual GIS tool overhead.
