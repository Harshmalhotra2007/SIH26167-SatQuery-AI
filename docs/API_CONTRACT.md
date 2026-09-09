# API Contract — SatQuery AI

Base URL (dev): `http://localhost:8000/api`

All responses are JSON. All errors follow the error shape at the bottom.

---

## 1. Upload image

`POST /upload`

**Request:** `multipart/form-data`
| Field | Type | Notes |
|---|---|---|
| `file` | file | image/jpeg, image/png |

**Response 200**
```json
{
  "image_id": "img_7f3a9c",
  "filename": "site_2024.jpg",
  "width": 1024,
  "height": 768
}
```

---

## 2. Ask a question (VQA / captioning / counting)

`POST /query`

**Request**
```json
{
  "image_id": "img_7f3a9c",
  "question": "How many buildings are visible in this image?"
}
```
- If `question` is omitted or empty, backend treats it as a captioning request.

**Response 200**
```json
{
  "answer": "There are approximately 14 buildings visible, mostly clustered in the northern half of the image.",
  "model_used": "gemini-1.5-flash",
  "latency_ms": 1240
}
```

---

## 3. Change detection

`POST /change`

**Request:** `multipart/form-data`
| Field | Type | Notes |
|---|---|---|
| `image_before` | file | earlier timestamp |
| `image_after` | file | later timestamp |

**Response 200**
```json
{
  "overlay_image_url": "/static/diffs/diff_a1b2c3.png",
  "description": "A new structure has appeared in the central-east region of the image, and vegetation cover has decreased along the southern edge.",
  "change_percentage": 12.4,
  "model_used": "gemini-1.5-flash"
}
```

---

## 4. Health check

`GET /health`

**Response 200**
```json
{ "status": "ok", "vlm_backend": "gemini", "fallback_available": true }
```

---

## Error shape (all endpoints)

**Response 4xx/5xx**
```json
{
  "error": {
    "code": "INVALID_IMAGE",
    "message": "Uploaded file is not a valid image."
  }
}
```

| Code | When |
|---|---|
| `INVALID_IMAGE` | Corrupt/unsupported file format |
| `IMAGE_NOT_FOUND` | `image_id` doesn't exist (expired/never uploaded) |
| `VLM_UNAVAILABLE` | Both Gemini and local fallback failed |
| `QUERY_TOO_LONG` | Question exceeds length limit (define: 500 chars) |

---

## Notes for both frontend and backend devs
- `image_id` is server-generated and short-lived (in-memory or temp-dir storage is fine for a hackathon — no need for a database).
- Keep this file as the single source of truth. If either side needs a field changed, update this file first, then code.
