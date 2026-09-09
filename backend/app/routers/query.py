import os
import time
from pathlib import Path
from typing import Dict

from fastapi import APIRouter, HTTPException
from app.models.schemas import QueryRequest, QueryResponse, ErrorDetail
from app.services.vlm_service import VLMService

router = APIRouter()

vlm_service = VLMService()

# imported from upload router
from app.routers.upload import get_registry


@router.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    _image_registry: Dict[str, dict] = get_registry()
    meta = _image_registry.get(req.image_id)
    if not meta:
        raise HTTPException(
            status_code=404,
            detail=ErrorDetail(code="IMAGE_NOT_FOUND", message="Image not found or expired.").model_dump(),
        )
    question = req.question or ""
    if len(question) > int(os.getenv("MAX_QUESTION_LENGTH", "500")):
        raise HTTPException(
            status_code=400,
            detail=ErrorDetail(code="QUERY_TOO_LONG", message="Question exceeds 500 characters.").model_dump(),
        )
    t0 = time.perf_counter()
    answer = await vlm_service.ask(Path(meta["path"]), question)
    latency_ms = int((time.perf_counter() - t0) * 1000)
    return QueryResponse(answer=answer, model_used=vlm_service.last_model_used(), latency_ms=latency_ms)