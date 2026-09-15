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
    assert "confidence" in data
    assert "execution_trace" in data


def test_cross_modal_and_report_endpoints():
    opt_bytes = create_test_image_bytes(color=(100, 100, 255))
    sar_bytes = create_test_image_bytes(color=(50, 50, 50))

    res_opt = client.post("/api/upload", files={"file": ("optical.tif", opt_bytes, "image/tiff")})
    res_sar = client.post("/api/upload", files={"file": ("sar.tif", sar_bytes, "image/tiff")})

    opt_id = res_opt.json()["image_id"]
    sar_id = res_sar.json()["image_id"]

    cm_res = client.post(
        "/api/query/cross-modal",
        json={
            "optical_image_id": opt_id,
            "sar_image_id": sar_id,
            "question": "Cross-reference Sentinel-2 optical reflectance and Sentinel-1 SAR backscatter."
        }
    )
    assert cm_res.status_code == 200
    cm_data = cm_res.json()
    assert "answer" in cm_data
    assert "confidence" in cm_data
    assert "execution_trace" in cm_data

    # Report Download test
    report_res = client.post(
        "/api/report/download",
        json={
            "task_name": "Cross-Modal Analysis",
            "query_or_prompt": "Cross-reference optical and SAR",
            "model_used": "BigEarthNet-QLoRA",
            "confidence_score": 0.92,
            "execution_time_ms": 120,
            "tools_invoked": ["RasterioLoader", "SARDoubleBounceAnalyzer"],
            "output_narrative": "Complementary optical and SAR analysis verified."
        }
    )
    assert report_res.status_code == 200
    assert "satquery_execution_report" in report_res.headers["content-disposition"]

