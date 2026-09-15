# Dataset & Demo Imagery — SatQuery AI

## Purpose of this file
Track datasets used for (a) vision-language adaptation fine-tuning, (b) official benchmark evaluation suites, and (c) curated judge-facing demo imagery.

## Primary Adaptation Dataset (Mandatory SIH Requirement)

### BigEarthNet.txt (`BIFOLD-BigEarthNetv2-0/BigEarthNet.txt`)
- **Role:** **Primary adaptation dataset** for fine-tuning image-text representations on multisensor remote-sensing data.
- **Modality:** Co-registered Sentinel-1 (SAR VV/VH) and Sentinel-2 (Optical 12-band) multispectral image patches.
- **Annotations:** 9.6M+ multi-label text annotations spanning 19 CLC land cover categories.
- **Usage:** Used in `train/train_qlora.py` to adapt vision-language representations to complementary optical and SAR satellite signatures via QLoRA.

---

## Evaluation Benchmark Datasets

| Benchmark Dataset | Evaluation Task | Source / HuggingFace Repo |
|---|---|---|
| **CDVQA** | Multitemporal change-based Visual Question Answering | `ljx620/CDVQA` |
| **VRSBench** | Multi-category Remote Sensing VQA (Quantity, Position, Color, Shape, etc.) | `xiang709/VRSBench` |
| **RSVQA-LRBEN** | Low/High-Resolution Remote Sensing VQA (Presence & Comparison) | RSVQA benchmark repository |
| **LEVIR-CD** | Bi-temporal spatial change detection overlay & visual diffs | LEVIR-CD benchmark |
| **RSICD** | Remote Sensing Image Captioning Dataset | RSICD |

---

## Curated Demo Set

| # | Image(s) / Modality | Feature Demoed | Source | Verified Working |
|---|---|---|---|---|
| 1 | Sentinel-2 Optical RGB / GeoTIFF | Single-Image VQA & Auto-Captioning | ISRO Bhuvan / Sentinel-2 | ☑ |
| 2 | Sentinel-1 SAR + Sentinel-2 Optical Pair | **Cross-Modal Optical + SAR Analysis** | BigEarthNet.txt / RISAT | ☑ |
| 3 | Bi-Temporal Image Pair (Date A / Date B) | **Change-Based VQA & Visual Diffing** | CDVQA / LEVIR-CD | ☑ |
| 4 | Cartosat-2S / High-Res GeoTIFF | Prompt-Based Counting & Grounded Grounding | Cartosat-2S | ☑ |

---

## Licensing & Citation
BigEarthNet.txt is licensed under CC-BY 4.0. RSICD, CDVQA, VRSBench, and LEVIR-CD are open-source research datasets used with attribution in compliance with hackathon regulations.
