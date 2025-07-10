from fastapi import APIRouter, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
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
    summary="Add a new product with image and details",
    response_description="Status of product addition",
    responses={
        200: {"description": "Product added successfully.", "content": {"application/json": {"example": {"status": "success", "message": "Product added."}}}},
        409: {"description": "Duplicate product image.", "content": {"application/json": {"example": {"status": "duplicate", "message": "Product image already exists."}}}},
        500: {"description": "Internal server error.", "content": {"application/json": {"example": {"status": "error", "message": "Error message."}}}},
    },
)
async def add_product(
    image: UploadFile = File(..., description="Product image file (jpg/png)"),
    name: str = Form(..., description="Product name"),
    price: float = Form(..., description="Product price"),
    description: str = Form(..., description="Product description")
):
    """Add a new product to the catalog. Deduplicates by image hash and embeds image with CLIP."""
    try:
        image_bytes = await image.read()
        sha256 = hashlib.sha256(image_bytes).hexdigest()
        products_col = get_products_collection()
        if products_col.find_one({"image_hash": sha256}):
            return JSONResponse(status_code=409, content={"status": "duplicate", "message": "Product image already exists."})
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
        return {"status": "success", "message": "Product added."}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)}) 