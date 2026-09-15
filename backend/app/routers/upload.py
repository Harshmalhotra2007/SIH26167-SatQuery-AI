import os
import time
import uuid
from pathlib import Path
from typing import Dict

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import UploadResponse, ErrorDetail
from app.services.image_service import ImageService

from app.core.config import get_upload_dir

router = APIRouter()

UPLOAD_DIR = get_upload_dir()
image_service = ImageService(upload_dir=UPLOAD_DIR)


_image_registry: Dict[str, dict] = {}


@router.post("/upload", response_model=UploadResponse)
async def upload(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=ErrorDetail(code="INVALID_IMAGE", message="Uploaded file is not a valid image.").model_dump(),
        )
    image_id = f"img_{uuid.uuid4().hex[:8]}"
    dest = UPLOAD_DIR / f"{image_id}.jpg"
    content = await file.read()
    width, height = image_service.save(content, dest)
    _image_registry[image_id] = {"path": str(dest), "ts": time.time()}
    image_url = f"/static/{image_id}.jpg"
    return UploadResponse(
        image_id=image_id,
        filename=file.filename or "image.jpg",
        width=width,
        height=height,
        image_url=image_url,
    )


def get_registry() -> Dict[str, dict]:
    return _image_registry
