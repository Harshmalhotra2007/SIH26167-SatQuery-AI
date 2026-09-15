from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class UploadResponse(BaseModel):
    image_id: str
    filename: str
    width: int
    height: int
    image_url: str


class ExecutionTrace(BaseModel):
    selected_task: str
    model_used: str
    checkpoint_adapter: str
    tools_invoked: List[str]
    parameters: Dict[str, Any]
    confidence_score: float
    execution_time_ms: int


class QueryRequest(BaseModel):
    image_id: str
    question: Optional[str] = ""


class CrossModalQueryRequest(BaseModel):
    optical_image_id: str
    sar_image_id: str
    question: Optional[str] = "Extract complementary land cover and soil/water structure from optical and SAR signatures."


class QueryResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    answer: str
    model_used: str
    latency_ms: int
    confidence: float = 0.92
    execution_trace: Optional[ExecutionTrace] = None


class ChangeRequest(BaseModel):
    image_id_before: Optional[str] = None
    image_id_after: Optional[str] = None
    question: Optional[str] = "What structural changes occurred between these two observation dates?"


class ChangeResponse(BaseModel):
    model_config = {"protected_namespaces": ()}
    overlay_image_url: str
    description: str
    change_percentage: float
    model_used: str
    confidence: float = 0.89
    execution_trace: Optional[ExecutionTrace] = None


class HealthResponse(BaseModel):
    status: str
    vlm_backend: str
    fallback_available: bool


class ErrorResponse(BaseModel):
    error: "ErrorDetail"


class ErrorDetail(BaseModel):
    code: str
    message: str