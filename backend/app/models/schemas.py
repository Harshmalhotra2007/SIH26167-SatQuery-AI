from pydantic import BaseModel
from typing import Optional


class UploadResponse(BaseModel):
    image_id: str
    filename: str
    width: int
    height: int
    image_url: str



class QueryRequest(BaseModel):
    image_id: str
    question: Optional[str] = ""


class QueryResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    answer: str
    model_used: str
    latency_ms: int


class ChangeRequest(BaseModel):
    pass  # multipart/form-data handled separately


class ChangeResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    overlay_image_url: str
    description: str
    change_percentage: float
    model_used: str



class HealthResponse(BaseModel):
    status: str
    vlm_backend: str
    fallback_available: bool


class ErrorResponse(BaseModel):
    error: "ErrorDetail"


class ErrorDetail(BaseModel):
    code: str
    message: str