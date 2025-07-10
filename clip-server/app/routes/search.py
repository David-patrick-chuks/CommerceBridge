from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.db import get_products_collection
from app.clip_utils import image_to_embedding
from app.schemas import ProductSearchResult, SearchResponse, ErrorResponse
import io
from PIL import Image
import numpy as np

router = APIRouter()

@router.post(
    "/search",
    tags=["Products"],
    summary="Search for similar products by image (and optional text query)",
    response_model=SearchResponse,
    response_description="Top product matches with similarity scores",
    responses={
        200: {"description": "Search results.", "content": {"application/json": {"example": {"matches": [
            {"name": "Red Shoes", "price": 49.99, "description": "Stylish red shoes.", "similarity": 0.92},
            {"name": "Maroon Sneakers", "price": 39.99, "description": "Comfortable maroon sneakers.", "similarity": 0.88}
        ]}}}},
        500: {"description": "Internal server error.", "content": {"application/json": {"example": {"status": "error", "message": "Error message."}}}},
    },
)
async def search_products(
    image: UploadFile = File(..., description="Query image file (jpg/png)"),
    query: str = Form(None, description="Optional text query to filter products")
):
    """Search for similar products by uploading an image (and optional text query). Returns top matches with similarity scores."""
    try:
        image_bytes = await image.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        query_embedding = image_to_embedding(pil_image)
        products_col = get_products_collection()
        mongo_filter = {}
        if query:
            mongo_filter = {
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}}
                ]
            }
        products = list(products_col.find(mongo_filter))
        if not products:
            return {"matches": []}
        def cosine_sim(a, b):
            a = np.array(a)
            b = np.array(b)
            return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
        results = []
        for p in products:
            sim = cosine_sim(query_embedding, p["embedding"])
            results.append(ProductSearchResult(
                name=p["name"],
                price=p["price"],
                description=p["description"],
                similarity=sim
            ))
        results.sort(key=lambda x: x.similarity, reverse=True)
        return {"matches": results[:5]}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)}) 