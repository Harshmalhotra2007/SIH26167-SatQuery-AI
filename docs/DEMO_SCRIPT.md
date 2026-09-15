# Demo Script — SatQuery AI (target: 90 seconds)

Rehearse this sequence to showcase all 5 mandatory ISRO SIH26167 capabilities cleanly within 90 seconds.

## Sequence

**[0:00–0:10] Hook**
"Analysts spend hours manually scanning satellite imagery. SatQuery AI brings natural language interaction, cross-modal SAR+optical reasoning, and fine-tuned domain intelligence to remote sensing."

**[0:10–0:30] VQA, Auto-Captioning & GeoTIFF Support**
- Upload a Sentinel-2 / Cartosat-2S GeoTIFF image.
- Click "Auto-Caption" → view fine-tuned land cover description.
- Ask: "Identify land cover types and built-up density." → display response + confidence score.

**[0:30–0:50] Cross-Modal Analysis (Optical + SAR)**
- Switch to **Cross-Modal (Optical + SAR)** tab.
- Upload co-registered Optical image (Sentinel-2) + SAR image (Sentinel-1 VV/VH).
- Ask: "Combine optical and SAR signatures to locate built-up areas and soil moisture anomalies."
- Call out: "Our fine-tuned vision-language engine fuses optical surface reflectances with SAR backscatter penetration."

**[0:50–0:70] Change-Based VQA (Change-VQA)**
- Switch to **Change-VQA** tab. Upload bi-temporal image pair (Date A & Date B).
- Enter question: "What structural changes occurred between these two dates?"
- Render visual diff overlay + natural language change answer.

**[0:70–0:90] Agentic Execution Trace & Fine-Tuning Proof**
- Show the **Observable Execution Trace** panel displaying active tool selection, model parameters, confidence score, and BigEarthNet QLoRA fine-tuned checkpoint.
- Click "Download Execution Report" to generate full PDF/JSON audit log.
- Close: "Fully compliant with all 5 ISRO mandatory requirements: VQA, Grounding, Change-VQA, Cross-Modal Optical+SAR, and Agentic Execution Tracing."

---

## Fallback Plan & Pre-Demo Checklist
- [x] BigEarthNet.txt QLoRA fine-tuned weights ready locally on RTX 4050 GPU
- [x] Cloud serverless VLM API fallback verified on Vercel deployment
- [x] Pre-recorded 60-second backup video ready
