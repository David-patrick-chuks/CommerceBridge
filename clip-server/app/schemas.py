from pydantic import BaseModel, Field
from typing import Optional, List

class ProductBase(BaseModel):
    name: str
    price: float
    description: str

class ProductCreate(ProductBase):
    pass

class ProductSearchResult(ProductBase):
    similarity: float = Field(..., ge=0, le=1)

class ErrorResponse(BaseModel):
    status: str
    message: str

class SearchResponse(BaseModel):
    matches: List[ProductSearchResult] 