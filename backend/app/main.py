import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import router
from app.services.vlm_service import VLMService

app = FastAPI(title="SatQuery AI", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static uploads
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./tmp_uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(UPLOAD_DIR)), name="static")

# Health
vlm_service = VLMService()

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "vlm_backend": vlm_service.backend_name(),
        "fallback_available": vlm_service.fallback_available(),
    }

# API routes
app.include_router(router, prefix="/api")
