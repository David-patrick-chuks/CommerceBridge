from fastapi import APIRouter, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from typing import List
from app.db import get_products_collection
from app.clip_utils import image_to_embedding
from app.schemas import ErrorResponse
import hashlib
import io
from PIL import Image

router = APIRouter()

@router.post(
    "/add_product",
    tags=["Products"],
    summary="Add a new product with multiple images and details",
    response_description="Status of product addition",
    responses={
        200: {"description": "Product(s) added successfully.", "content": {"application/json": {"example": {"status": "success", "added": 3, "duplicates": 1, "errors": 0}}}},
        500: {"description": "Internal server error.", "content": {"application/json": {"example": {"status": "error", "message": "Error message."}}}},
    },
)
async def add_product(
    images: List[UploadFile] = File(..., description="Product image files (jpg/png)"),
    name: str = Form(..., description="Product name"),
    price: float = Form(..., description="Product price"),
    description: str = Form(..., description="Product description")
):
    """Add a new product to the catalog. Deduplicates by image hash and embeds each image with CLIP."""
    added, duplicates, errors = 0, 0, 0
    error_details = []
    products_col = get_products_collection()
    for image in images:
        try:
            image_bytes = await image.read()
            sha256 = hashlib.sha256(image_bytes).hexdigest()
            if products_col.find_one({"image_hash": sha256}):
                duplicates += 1
                continue
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            embedding = image_to_embedding(pil_image)
            product_doc = {
                "name": name,
                "price": price,
                "description": description,
                "image_hash": sha256,
                "embedding": embedding,
            }
            products_col.insert_one(product_doc)
            added += 1
        except Exception as e:
            errors += 1
            error_details.append(str(e))
    status = "success" if added > 0 else ("duplicate" if duplicates > 0 and errors == 0 else "error")
    return JSONResponse(status_code=200 if added > 0 else 500, content={
        "status": status,
        "added": added,
        "duplicates": duplicates,
        "errors": errors,
        "error_details": error_details
    }) 