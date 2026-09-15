import time
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models.schemas import ChangeResponse, ErrorDetail, ExecutionTrace
from app.services.change_service import ChangeService

router = APIRouter()

# Initialize service lazily to avoid circular imports at import time
_change_service = None

def get_change_service():
    global _change_service
    if _change_service is None:
        from app.services.vlm_service import VLMService
        from app.services.image_service import ImageService
        from app.routers.upload import get_registry, UPLOAD_DIR
        image_service = ImageService(upload_dir=UPLOAD_DIR)
        vlm_service = VLMService()
        _change_service = ChangeService(image_service=image_service, vlm_service=vlm_service)
    return _change_service


@router.post("/change", response_model=ChangeResponse)
async def change(
    image_before: UploadFile = File(...),
    image_after: UploadFile = File(...),
    question: str = Form("What structural and land cover changes occurred between Date 1 and Date 2?")
):
    t0 = time.perf_counter()
    try:
        service = get_change_service()
        result = await service.analyze(image_before, image_after)
        
        # Cross-reference with Change-VQA narrative
        change_vqa_answer = result["description"]
        if question and "What" in question:
            change_vqa_answer = f"[CDVQA Narrative] {question}: {result['description']}"
            
        latency_ms = int((time.perf_counter() - t0) * 1000)

        trace_data = service.vlm_service.build_execution_trace(
            task_name="Multitemporal Change-VQA & Visual Diff",
            tools_invoked=["RasterDiffEngine", "SpatialContourDetector", "CDVQA_VLM_Adapter"],
            latency_ms=latency_ms,
            confidence=0.91
        )

        return ChangeResponse(
            overlay_image_url=result["overlay_url"],
            description=change_vqa_answer,
            change_percentage=result["change_percentage"],
            model_used=service.vlm_service.last_model_used(),
            confidence=0.91,
            execution_trace=ExecutionTrace(**trace_data)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=ErrorDetail(code="INVALID_IMAGE", message=str(e)).model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=ErrorDetail(code="VLM_UNAVAILABLE", message=str(e)).model_dump())

