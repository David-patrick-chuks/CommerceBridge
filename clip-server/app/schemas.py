from pydantic import BaseModel, Field
from typing import List

class MatchedImage(BaseModel):
    image_url: str
    image_hash: str
    similarity: float = Field(..., ge=0, le=1)

class ProductBase(BaseModel):
    name: str
    price: float
    description: str
    category: str
    image_urls: List[str]
    image_hashes: List[str]
    embeddings: List[List[float]]

class ProductCreate(ProductBase):
    pass

class ProductSearchResult(BaseModel):
    name: str
    price: float
    description: str
    category: str
    image_urls: List[str]
    matched_images: List[MatchedImage]

class ErrorResponse(BaseModel):
    status: str
    message: str

class SearchResponse(BaseModel):
    matches: List[ProductSearchResult] 