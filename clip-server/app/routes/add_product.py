from fastapi import APIRouter, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from app.db import get_products_collection
from app.clip_utils import image_to_embedding
from app.schemas import ErrorResponse
import hashlib
import io
from PIL import Image

router = APIRouter()

@router.post("/add_product")
async def add_product(
    image: UploadFile = File(...),
    name: str = Form(...),
    price: float = Form(...),
    description: str = Form(...)
):
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