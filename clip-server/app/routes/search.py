from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.db import get_products_collection
from app.clip_utils import image_to_embedding
from app.schemas import ProductSearchResult, SearchResponse, ErrorResponse
import io
from PIL import Image
import numpy as np
from typing import Optional

router = APIRouter()

@router.post(
    "/search",
    tags=["Products"],
    summary="Search for similar products by image (and optional text query)",
    response_model=SearchResponse,
    response_description="Top product matches with similarity scores",
    responses={
        200: {"description": "Search results.", "content": {"application/json": {"example": {"matches": [
            {"name": "Cool Cap", "price": 2500, "description": "A stylish cap for all seasons.", "category": "Accessories", "image_urls": ["...", "...", "...", "..."], "matched_images": [{"image_url": "...", "image_hash": "...", "similarity": 0.92}]}
        ]}}}},
        500: {"description": "Internal server error.", "content": {"application/json": {"example": {"status": "error", "message": "Error message."}}}},
    },
)
async def search_products(
    image: Optional[UploadFile] = File(None, description="Query image file (jpg/png)"),
    query: str = Form(None, description="Optional text query to filter products")
):
    """Search for similar products by uploading an image (and optional text query). Returns top matches with similarity scores."""
    try:
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
        results = []
        SIMILARITY_THRESHOLD = 0.7
        if image is not None:
            image_bytes = await image.read()
            pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            query_embedding = image_to_embedding(pil_image)
            def cosine_sim(a, b):
                a = np.array(a)
                b = np.array(b)
                return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))
            for p in products:
                matched_images = []
                for idx, emb in enumerate(p["embeddings"]):
                    sim = cosine_sim(query_embedding, emb)
                    sim = min(max(sim, 0.0), 1.0)
                    if sim >= SIMILARITY_THRESHOLD:
                        matched_images.append({
                            "image_url": p["image_urls"][idx],
                            "image_hash": p["image_hashes"][idx],
                            "similarity": sim
                        })
                if matched_images:
                    results.append({
                        "name": p["name"],
                        "price": p["price"],
                        "description": p["description"],
                        "category": p["category"],
                        "image_urls": p["image_urls"],
                        "matched_images": matched_images
                    })
            results.sort(key=lambda x: max([m["similarity"] for m in x["matched_images"]]) if x["matched_images"] else 0, reverse=True)
            return {"matches": results[:5]}
        else:
            # Text-only search: return all matching products with all images, matched_images empty
            for p in products:
                results.append({
                    "name": p["name"],
                    "price": p["price"],
                    "description": p["description"],
                    "category": p["category"],
                    "image_urls": p["image_urls"],
                    "matched_images": []
                })
            return {"matches": results[:5]}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)}) 