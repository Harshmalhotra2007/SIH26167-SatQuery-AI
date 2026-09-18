# API Contract - SatQuery AI (ISRO SIH26167)

Base URL (dev): http://localhost:8000/api
Live: https://sih26167-satquery-ai.vercel.app/api

Supported formats: GeoTIFF (.tif, .tiff), JPEG, PNG, WEBP. All responses are JSON.

Backend note. The deployed API serves Gemini 1.5 Flash. The BigEarthNet-adapted LoRA adapter (train/checkpoints/final_adapter/) is used for offline evaluation and is available as an alternative local backend. Response examples are illustrative, not measured benchmarks.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | /upload | Upload image (GeoTIFF/PNG/JPEG). Returns image_id. |
| POST | /query | Single-image VQA. Body: image_id, question. |
| POST | /query/cross-modal | Optical + SAR joint analysis. Body: optical_image_id, sar_image_id, question. |
| POST | /change | Bi-temporal change VQA. Multipart: image_before, image_after, question. |
| POST | /report/download | Export execution trace as JSON. |
| GET | /health | Returns status, vlm_backend, fallback_available. |

## Response shape (all endpoints)

    {
      "answer": "<model response>",
      "model_used": "gemini-1.5-flash",
      "latency_ms": 1100,
      "confidence": null,
      "execution_trace": {
        "selected_task": "Single-Image VQA",
        "model_used": "gemini-1.5-flash",
        "tools_invoked": ["RasterImageLoader", "GeminiVLMService"],
        "execution_time_ms": 1100
      }
    }

Note: confidence is null because the backend does not currently expose token-level probabilities.

## Error shape

    {
      "error": {
        "code": "INVALID_IMAGE",
        "message": "Uploaded file is not a valid image or GeoTIFF."
      }
    }

## Error codes

| Status | Code | Meaning |
|---|---|---|
| 400 | INVALID_IMAGE | Upload is not a valid image or GeoTIFF |
| 404 | IMAGE_NOT_FOUND | image_id not recognised |
| 422 | EMPTY_QUESTION | Question string is empty |
| 503 | VLM_UNAVAILABLE | Both Gemini and local fallback are down |