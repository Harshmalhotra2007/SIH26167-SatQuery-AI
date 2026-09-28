# SatQuery AI - SIH26167



Interactive vision-language assistant for multimodal remote sensing image analysis, built for SIH 2026 (ISRO Problem Statement SIH26167).



> \*\*Note:\*\* Earlier versions of this README contained placeholder benchmark numbers that were never measured. Those have been removed. All numbers currently shown are from real model runs on Kaggle T4 GPUs.



\## Status



| Capability | Status |

|---|---|

| Backend API (FastAPI) with image upload and VQA endpoints | \[done] Implemented |

| Frontend (React) with file upload and chat interface | \[done] Implemented |

| GeoTIFF/TIFF support via rasterio | \[done] Implemented |

| Multimodal collator for Qwen2-VL chat formatting | \[done] Implemented |

| BigEarthNet.txt join (2441 real Q\&A pairs, 1000 Sentinel-2 images) | \[done] Implemented |

| QLoRA fine-tuning pipeline for Qwen2-VL-2B | \[done] Implemented |

| Smoke test (30 steps, 80.6% loss reduction) | \[done] Verified |

| Full fine-tune (400 steps, 2885 samples) | \[done] Complete - loss 2.67 to 0.18 |

| BigEarthNet held-out evaluation (2000 samples) | \[done] Complete - see docs/ADAPTATION.md |

| RSVQA-LR-2k evaluation (2000 samples) | \[done] Complete - see docs/ADAPTATION.md |

| Cross-modal (Optical + SAR) reasoning | \[done] Implemented in backend |

| Change-based VQA | \[done] Implemented in backend |

| CDVQA evaluation | \[pending] Cross-domain limit documented |

| VRSBench evaluation | \[pending] Not implemented |



\## Fine-Tuning Results



See `docs/ADAPTATION.md` for the full adaptation report.



\*\*Smoke test\*\* (30 steps, 20 samples):

\- Initial loss: 3.074 to final loss: 0.281

\- First-third mean: 1.528 to last-third mean: 0.296

\- Loss reduction: 80.6%



\*\*Full fine-tune\*\* (400 steps, 2885 samples):

\- Initial loss: 2.67 to final loss: 0.18

\- First-third mean: 0.7482 to last-third mean: 0.3836

\- Runtime: 34 minutes on Kaggle T4 x2



\*\*BigEarthNet held-out evaluation\*\* (2000 samples):

\- Base Qwen2-VL-2B-Instruct: 19.25%

\- BigEarthNet-adapted (400 steps): 42.05% (+22.80 points, +118% relative)



The adapter more than doubles accuracy on the training domain.



\*\*RSVQA-LR-2k benchmark\*\* (2000-sample validation split):

\- Base Qwen2-VL-2B-Instruct: 43.80%

\- BigEarthNet-adapted (400 steps): 39.95%

\- BigEarthNet-adapted (150 steps): 42.95%



Fine-tuning on BigEarthNet does not improve cross-domain accuracy on RSVQA-LR-2k. The adapter improves on the open-ended "other" category (+2.48 points) but loses on the "comparison" category, where the base model exploits a strong response prior. See `docs/ADAPTATION.md` for full analysis.



Combined, the two evaluations show that the adapter is domain-specific: it improves substantially on BigEarthNet-distribution queries and does not transfer to a different remote-sensing VQA benchmark.



\## Architecture



\- \*\*Backend:\*\* FastAPI, Gemini 1.5 Flash primary, local Qwen2-VL-2B with BigEarthNet LoRA adapter as offline alternative

\- \*\*Frontend:\*\* React + Vite + Tailwind

\- \*\*Training:\*\* QLoRA 4-bit NF4 on Qwen2-VL-2B, 0.42% trainable parameters, Kaggle T4 x2

\- \*\*Datasets:\*\* BigEarthNet.txt for adaptation, RSVQA-LR-2k for evaluation



\## Documentation



\- `docs/ADAPTATION.md` - full adaptation and evaluation report

\- `docs/ARCHITECTURE.md` - system design

\- `docs/API\_CONTRACT.md` - endpoint reference

\- `docs/DATASET.md` - dataset details

\- `docs/DEMO\_SCRIPT.md` - demo walkthrough

\- `docs/PROBLEM\_STATEMENT.md` - SIH problem statement mapping



\## Quick Start



Backend:

cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload



Frontend:

cd frontend

npm install

npm run dev





\## License



See LICENSE file.

