# API Contract — SatQuery AI (ISRO SIH26167)

Base URL (dev): `http://localhost:8000/api` | Live Vercel: `https://sih26167-satquery-ai.vercel.app/api`

All responses are JSON. Supported image formats: **GeoTIFF (`.tif`, `.tiff`)**, JPEG, PNG, WEBP.

---

## 1. Upload image (Optical / SAR / GeoTIFF)

`POST /upload`

**Request:** `multipart/form-data`
| Field | Type | Notes |
|---|---|---|
| `file` | file | Optical / SAR / GeoTIFF (`.tif`, `.tiff`, `.jpg`, `.png`) |

**Response 200**
```json
{
  "image_id": "img_7f3a9c",
  "filename": "sentinel2_optical.tif",
  "width": 1024,
  "height": 768,
  "image_url": "/static/img_7f3a9c.jpg"
}
```

---

## 2. Single-Image VQA & Auto-Captioning

`POST /query`

**Request**
```json
{
  "image_id": "img_7f3a9c",
  "question": "Identify land cover classifications and built-up density."
}
```

**Response 200**
```json
{
  "answer": "High-resolution optical patch displaying mixed urban and agricultural land cover...",
  "model_used": "BigEarthNet-QLoRA / Qwen2-VL-2B-Instruct",
  "latency_ms": 110,
  "confidence": 0.94,
  "execution_trace": {
    "selected_task": "Single-Image VQA / Auto-Caption",
    "model_used": "BigEarthNet-QLoRA / Qwen2-VL-2B-Instruct",
    "checkpoint_adapter": "train/checkpoints/BigEarthNet_QLoRA_adapter.pt",
    "tools_invoked": ["RasterImageLoader", "BigEarthNet_VLM_Adapter"],
    "parameters": {
      "quantization": "4-bit NF4",
      "temperature": 0.2
    },
    "confidence_score": 0.94,
    "execution_time_ms": 110
  }
}
```

---

## 3. Cross-Modal Reasoning (Optical + SAR)

`POST /query/cross-modal`

**Request**
```json
{
  "optical_image_id": "img_opt_123",
  "sar_image_id": "img_sar_456",
  "question": "Cross-reference optical surface reflectances and SAR backscatter penetration."
}
```

**Response 200**
```json
{
  "answer": "[Cross-Modal Optical+SAR Analysis] Integrated analysis of co-registered Optical and SAR imagery...",
  "model_used": "BigEarthNet-QLoRA Cross-Modal / Qwen2-VL-2B",
  "latency_ms": 140,
  "confidence": 0.92,
  "execution_trace": {
    "selected_task": "Cross-Modal Optical + SAR Analysis",
    "model_used": "BigEarthNet-QLoRA Cross-Modal / Qwen2-VL-2B",
    "checkpoint_adapter": "train/checkpoints/BigEarthNet_QLoRA_adapter.pt",
    "tools_invoked": ["OpticalRasterioLoader", "SARDoubleBounceAnalyzer", "CrossModalFusionAdapter"],
    "confidence_score": 0.92,
    "execution_time_ms": 140
  }
}
```

---

## 4. Change-Based VQA & Spatial Diffing (CDVQA Benchmark)

`POST /change`

**Request:** `multipart/form-data`
| Field | Type | Notes |
|---|---|---|
| `image_before` | file | Baseline GeoTIFF/PNG (Date A) |
| `image_after` | file | Follow-up GeoTIFF/PNG (Date B) |
| `question` | string | Form string prompt: e.g. "What structural changes occurred between Date 1 and Date 2?" |

**Response 200**
```json
{
  "overlay_image_url": "/static/diffs/diff_a1b2c3.png",
  "description": "[CDVQA Narrative] Multitemporal comparison between Date A and Date B...",
  "change_percentage": 14.2,
  "model_used": "CDVQA-Adapted / Qwen2-VL-2B",
  "confidence": 0.91,
  "execution_trace": {
    "selected_task": "Multitemporal Change-VQA & Visual Diff",
    "model_used": "CDVQA-Adapted / Qwen2-VL-2B",
    "checkpoint_adapter": "train/checkpoints/BigEarthNet_QLoRA_adapter.pt",
    "tools_invoked": ["RasterDiffEngine", "SpatialContourDetector", "CDVQA_VLM_Adapter"],
    "confidence_score": 0.91,
    "execution_time_ms": 180
  }
}
```

---

## 5. Download Execution Audit Report

`POST /report/download`

**Request**
```json
{
  "task_name": "Cross-Modal Optical + SAR Analysis",
  "query_or_prompt": "Cross-reference optical and SAR",
  "model_used": "BigEarthNet-QLoRA",
  "confidence_score": 0.92,
  "execution_time_ms": 140,
  "tools_invoked": ["OpticalRasterioLoader", "SARDoubleBounceAnalyzer"],
  "output_narrative": "Complementary optical and SAR analysis verified."
}
```

**Response 200** (`application/json`, Content-Disposition attachment: `satquery_execution_report.json`)

---

## 6. Health check

`GET /health`

**Response 200**
```json
{ "status": "ok", "vlm_backend": "BigEarthNet-QLoRA-Standby", "fallback_available": true }
```

---

## Error shape (all endpoints)

**Response 4xx/5xx**
```json
{
  "error": {
    "code": "INVALID_IMAGE",
    "message": "Uploaded file is not a valid image or GeoTIFF."
  }
}
```

