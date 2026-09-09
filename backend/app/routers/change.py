from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import ChangeResponse, ErrorDetail
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
async def change(image_before: UploadFile = File(...), image_after: UploadFile = File(...)):
    try:
        service = get_change_service()
        result = await service.analyze(image_before, image_after)
        return ChangeResponse(
            overlay_image_url=result["overlay_url"],
            description=result["description"],
            change_percentage=result["change_percentage"],
            model_used="gemini",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=ErrorDetail(code="INVALID_IMAGE", message=str(e)).model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=ErrorDetail(code="VLM_UNAVAILABLE", message=str(e)).model_dump())
