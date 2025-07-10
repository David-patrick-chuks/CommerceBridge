import os
import hashlib
import io
import torch
import clip
from PIL import Image
from pymongo import MongoClient
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import numpy as np

app = FastAPI()

# Load environment variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "commercebridge")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "products")

# MongoDB client
mongo_client = MongoClient(MONGO_URI)
db = mongo_client[MONGO_DB]
products_col = db[MONGO_COLLECTION]

# Load CLIP model
clip_model, clip_preprocess = clip.load("ViT-B/32", device="cpu")

@app.post("/add_product")
async def add_product(
    image: UploadFile = File(...),
    name: str = Form(...),
    price: float = Form(...),
    description: str = Form(...)
):
    try:
        # Read image bytes
        image_bytes = await image.read()
        sha256 = hashlib.sha256(image_bytes).hexdigest()

        # Check for duplicate by hash
        if products_col.find_one({"image_hash": sha256}):
            return JSONResponse({"status": "duplicate", "message": "Product image already exists."}, status_code=409)

        # Load image for CLIP
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_input = clip_preprocess(pil_image).unsqueeze(0)

        # Generate embedding
        with torch.no_grad():
            image_features = clip_model.encode_image(image_input).cpu().numpy()[0].tolist()

        # Store in MongoDB
        product_doc = {
            "name": name,
            "price": price,
            "description": description,
            "image_hash": sha256,
            "embedding": image_features,
        }
        products_col.insert_one(product_doc)

        return JSONResponse({"status": "success", "message": "Product added."})
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)

@app.post("/search")
async def search_products(
    image: UploadFile = File(...),
    query: str = Form(None)
):
    try:
        # Read image bytes
        image_bytes = await image.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_input = clip_preprocess(pil_image).unsqueeze(0)

        # Generate embedding
        with torch.no_grad():
            query_embedding = clip_model.encode_image(image_input).cpu().numpy()[0]

        # Build MongoDB filter for optional keyword
        mongo_filter = {}
        if query:
            mongo_filter = {
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}}
                ]
            }

        # Fetch all (or filtered) products
        products = list(products_col.find(mongo_filter))
        if not products:
            return JSONResponse({"matches": []})

        # Compute cosine similarity
        def cosine_sim(a, b):
            a = np.array(a)
            b = np.array(b)
            return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

        for p in products:
            p["similarity"] = cosine_sim(query_embedding, p["embedding"])

        # Sort by similarity, return top 5
        products.sort(key=lambda x: x["similarity"], reverse=True)
        top_matches = [
            {
                "name": p["name"],
                "price": p["price"],
                "description": p["description"],
                "similarity": p["similarity"]
            }
            for p in products[:5]
        ]
        return JSONResponse({"matches": top_matches})
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)

# To run: uvicorn server:app --host 0.0.0.0 --port 8000 