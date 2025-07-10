import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Name of the MongoDB Atlas vector index for the embedding field
VECTOR_INDEX_NAME = "product_embedding_vector_index"  # Used for Atlas $vectorSearch aggregation

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB", "commercebridge")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "products")

_client = None
_db = None
_products_col = None

def get_db():
    global _client, _db
    if _db is None:
        _client = MongoClient(MONGO_URI)
        _db = _client[MONGO_DB]
    return _db

def get_products_collection():
    global _products_col
    if _products_col is None:
        db = get_db()
        _products_col = db[MONGO_COLLECTION]
    return _products_col 