import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def create_test_image_bytes(color=(255, 0, 0), size=(100, 100)) -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "vlm_backend" in data
    assert "fallback_available" in data


def test_upload_endpoint():
    img_bytes = create_test_image_bytes()
    response = client.post(
        "/api/upload",
        files={"file": ("test.jpg", img_bytes, "image/jpeg")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "image_id" in data
    assert data["filename"] == "test.jpg"
    assert data["width"] == 100
    assert data["height"] == 100
    assert "image_url" in data


def test_query_endpoint():
    img_bytes = create_test_image_bytes()
    upload_res = client.post(
        "/api/upload",
        files={"file": ("test.jpg", img_bytes, "image/jpeg")},
    )
    image_id = upload_res.json()["image_id"]

    query_res = client.post(
        "/api/query",
        json={"image_id": image_id, "question": "Describe this satellite image."},
    )
    assert query_res.status_code == 200
    data = query_res.json()
    assert "answer" in data
    assert "model_used" in data
    assert "latency_ms" in data


def test_change_endpoint():
    before_bytes = create_test_image_bytes(color=(255, 0, 0))
    after_bytes = create_test_image_bytes(color=(0, 255, 0))

    response = client.post(
        "/api/change",
        files={
            "image_before": ("before.jpg", before_bytes, "image/jpeg"),
            "image_after": ("after.jpg", after_bytes, "image/jpeg"),
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "overlay_image_url" in data
    assert "description" in data
    assert "change_percentage" in data
    assert data["change_percentage"] > 0
