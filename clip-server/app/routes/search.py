from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.db import get_products_collection
from app.clip_utils import image_to_embedding
from app.schemas import ProductSearchResult, SearchResponse, ErrorResponse
import io
from PIL import Image
import numpy as np

router = APIRouter()

@router.post("/search", response_model=SearchResponse)
async def search_products(
    image: UploadFile = File(...),
    query: str = Form(None)
):
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