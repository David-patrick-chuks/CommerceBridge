import pytest
from fastapi.testclient import TestClient
from app.main import app
import io
from PIL import Image

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "api" in data
    assert "mongodb" in data
    assert "clip_model" in data

def test_metrics_endpoint():
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "clipserver_requests_total" in response.text
    assert "clipserver_errors_total" in response.text

def create_test_image():
    img = Image.new("RGB", (32, 32), color=(255, 0, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf

def test_add_product_and_search():
    # Add a product
    img_buf = create_test_image()
    add_resp = client.post(
        "/add_product",
        files={"image": ("test.png", img_buf, "image/png")},
        data={"name": "Test Product", "price": 9.99, "description": "A test product."}
    )
    assert add_resp.status_code in (200, 409)  # 409 if duplicate
    # Search for the product
    img_buf = create_test_image()
    search_resp = client.post(
        "/search",
        files={"image": ("test.png", img_buf, "image/png")},
        data={}
    )
    assert search_resp.status_code == 200
    data = search_resp.json()
    assert "matches" in data
    assert isinstance(data["matches"], list) 