import os
import base64
import asyncio
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List

try:
    from google import genai
except Exception:  # pragma: no cover
    genai = None  # type: ignore

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gemini-3.8-flash"


def _mime_for(path: Path) -> str:
    ext = path.suffix.lower()
    if ext == ".png":
        return "image/png"
    if ext in (".jpg", ".jpeg"):
        return "image/jpeg"
    if ext in (".tif", ".tiff"):
        return "image/tiff"
    if ext == ".webp":
        return "image/webp"
    return "application/octet-stream"


class VLMService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.use_local = os.getenv("USE_LOCAL_FALLBACK", "true").lower() == "true"
        self._client = None
        self._model_name: Optional[str] = None
        self._last_model: Optional[str] = None
        self._local_model = None

        if self.api_key and genai is not None:
            try:
                self._client = genai.Client(api_key=self.api_key)
                self._model_name = os.getenv("GEMINI_MODEL", DEFAULT_MODEL)
                logger.info("VLMService initialised with model: %s", self._model_name)
            except Exception as e:
                logger.warning("Failed to initialise Gemini client: %s", e)
                self._client = None
                self._model_name = None

    def _encode_image(self, path: Path) -> str:
        return base64.b64encode(path.read_bytes()).decode("utf-8")

    def _image_part(self, path: Path) -> Any:
        """Return a genai Part for the given image path, with correct mime type."""
        return genai.types.Part.from_bytes(
            data=path.read_bytes(),
            mime_type=_mime_for(path),
        )

    async def _generate_with_retry(self, contents: List[Any], task_label: str) -> Optional[str]:
        """
        Call Gemini's models.generate_content with retry on transient errors.
        Returns the response text, or None on failure.
        """
        last_error: Optional[Exception] = None

        for attempt in range(3):
            try:
                resp = self._client.models.generate_content(
                    model=self._model_name,
                    contents=contents,
                )
                text = getattr(resp, "text", None)
                if text:
                    return text
                return None
            except Exception as e:
                last_error = e
                msg = str(e)
                # Retry on 503 UNAVAILABLE and 429 RESOURCE_EXHAUSTED
                if "503" in msg or "UNAVAILABLE" in msg or "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                    logger.info(
                        "%s: transient error on attempt %d/3 — %s",
                        task_label, attempt + 1, msg[:100],
                    )
                    await asyncio.sleep(2 + attempt)
                    continue
                # Non-retryable — log and stop
                logger.warning("%s: non-retryable error — %s", task_label, msg[:250])
                break

        if last_error is not None:
            logger.warning("%s: gave up after retries — %s", task_label, str(last_error)[:250])
        return None

    async def ask(self, image_path: Path, question: str) -> str:
        """Ask VLM about a single image."""
        if self._client is not None and self._model_name:
            prompt = question if question else "Describe this image in detail."
            text = await self._generate_with_retry(
                [self._image_part(image_path), prompt],
                "single-image VQA",
            )
            if text is not None:
                self._last_model = self._model_name
                return text
            self._last_model = "gemini-error"

        if self.use_local:
            return await self._ask_local(image_path, question)

        return "The vision model is temporarily unavailable. Please try again in a moment."

    async def ask_cross_modal(self, optical_path: Path, sar_path: Path, question: str) -> str:
        """Process co-registered Optical + SAR image pair."""
        if self._client is not None and self._model_name:
            prompt = (
                "Cross-reference the optical satellite imagery and SAR backscatter data. "
                "Question: "
                + (question if question else "Analyze complementary features across both modalities.")
            )
            text = await self._generate_with_retry(
                [self._image_part(optical_path), self._image_part(sar_path), prompt],
                "cross-modal",
            )
            if text is not None:
                self._last_model = self._model_name
                return text
            self._last_model = "gemini-error"

        self._last_model = "gemini-unavailable"
        return "Cross-modal analysis is temporarily unavailable. Please try again in a moment."

    async def ask_change_vqa(self, image_a_path: Path, image_b_path: Path, question: str) -> str:
        """Perform multitemporal Change-VQA over bi-temporal image pair."""
        if self._client is not None and self._model_name:
            prompt = (
                "Compare these two satellite images from different dates. "
                "Question: "
                + (question if question else "Describe what changed between these two time periods.")
            )
            text = await self._generate_with_retry(
                [self._image_part(image_a_path), self._image_part(image_b_path), prompt],
                "change-VQA",
            )
            if text is not None:
                self._last_model = self._model_name
                return text
            self._last_model = "gemini-error"

        self._last_model = "gemini-unavailable"
        return "Change-VQA is temporarily unavailable. Please try again in a moment."

    async def _ask_local(self, image_path: Path, question: str) -> str:
        if self._local_model is not None:
            prompt = question if question else "Describe this image in detail."
            resp = self._local_model(prompt, image_path)
            self._last_model = "local-fallback"
            return resp
        return "Local fallback model not configured."

    def build_execution_trace(self, task_name: str, tools_invoked: List[str], latency_ms: int, confidence: float = 0.94) -> Dict[str, Any]:
        return {
            "selected_task": task_name,
            "model_used": self.last_model_used(),
            "checkpoint_adapter": "N/A (Gemini API)",
            "tools_invoked": tools_invoked,
            "parameters": {
                "quantization": "N/A (Gemini API)",
                "temperature": 0.2,
                "max_new_tokens": 256,
            },
            "confidence_score": round(confidence, 2),
            "execution_time_ms": latency_ms,
        }

    def backend_name(self) -> str:
        if self._model_name:
            return self._model_name
        if self._local_model is not None:
            return "local"
        return "unavailable"

    def last_model_used(self) -> str:
        return self._last_model or self.backend_name()

    def fallback_available(self) -> bool:
        return self._local_model is not None