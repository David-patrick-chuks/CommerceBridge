from fastapi import FastAPI
from app.routes import add_product, search

app = FastAPI()

app.include_router(add_product.router)
app.include_router(search.router)

@app.get("/")
def health_check():
    return {"status": "ok"} 