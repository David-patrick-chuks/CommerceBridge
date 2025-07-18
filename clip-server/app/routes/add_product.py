from fastapi import APIRouter, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from typing import List
from app.db import get_products_collection
from app.clip_utils import image_to_embedding
from app.schemas import ErrorResponse
import hashlib
import io
from PIL import Image
import cloudinary
import cloudinary.uploader
import os

# Cloudinary config
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

router = APIRouter()

@router.post(
    "/add_product",
    tags=["Products"],
    summary="Add a new product with multiple images and details",
    response_description="Status of product addition",
    responses={
        200: {"description": "Product added successfully.", "content": {"application/json": {"example": {"status": "success", "added": 1, "duplicates": 0, "errors": 0}}}},
        500: {"description": "Internal server error.", "content": {"application/json": {"example": {"status": "error", "message": "Error message."}}}},
    },
)
async def add_product(
    images: List[UploadFile] = File(..., description="Product image files (jpg/png)"),
    name: str = Form(..., description="Product name"),
    price: float = Form(..., description="Product price"),
    description: str = Form(..., description="Product description"),
    category: str = Form(..., description="Product category")
):
    """Add a new product to the catalog. Deduplicates by image hash and embeds each image with CLIP."""
    products_col = get_products_collection()
    image_urls = []
    image_hashes = []
    embeddings = []
    duplicates = 0
    errors = 0
    error_details = []
    for image in images:
        try:
            image_bytes = await image.read()
            sha256 = hashlib.sha256(image_bytes).hexdigest()
            if products_col.find_one({"image_hashes": sha256}):
                duplicates += 1
                continue
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            embedding = image_to_embedding(pil_image)
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(io.BytesIO(image_bytes), folder="clip-products")
            image_url = upload_result["secure_url"]
            image_urls.append(image_url)
            image_hashes.append(sha256)
            embeddings.append(embedding)
        except Exception as e:
            errors += 1
            error_details.append(str(e))
    if len(image_urls) == 0:
        return JSONResponse(status_code=409, content={
            "status": "duplicate",
            "added": 0,
            "duplicates": duplicates,
            "errors": errors,
            "error_details": error_details
        })
    product_doc = {
        "name": name,
        "price": price,
        "description": description,
        "category": category,
        "image_urls": image_urls,
        "image_hashes": image_hashes,
        "embeddings": embeddings,
    }
    products_col.insert_one(product_doc)
    return JSONResponse(status_code=200, content={
        "status": "success",
        "added": 1,
        "duplicates": duplicates,
        "errors": errors,
        "error_details": error_details
    }) 