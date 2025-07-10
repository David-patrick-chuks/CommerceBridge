from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from app.routes import add_product, search
from app.db import get_db
from app.clip_utils import initialize_clip
import logging

app = FastAPI()

# Configure logging on startup
def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )

@app.on_event("startup")
def on_startup():
    setup_logging()
    logging.info("clip-server starting up...")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logging.info(f"Incoming request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        logging.exception(f"Error handling request: {request.method} {request.url.path}")
        raise

app.include_router(add_product.router)
app.include_router(search.router)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logging.warning(f"HTTPException: {exc.status_code} {exc.detail} on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "message": exc.detail},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logging.exception(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal server error."},
    )

@app.get("/")
def health_check():
    return {"status": "ok"}

@app.get("/health", tags=["Health"], summary="Health check for API, DB, and CLIP model")
def full_health_check():
    status = {"api": "ok"}
    # Check MongoDB
    try:
        db = get_db()
        db.command("ping")
        status["mongodb"] = "ok"
    except Exception as e:
        status["mongodb"] = f"error: {str(e)}"
    # Check CLIP model
    try:
        model, preprocess = initialize_clip()
        if model is not None and preprocess is not None:
            status["clip_model"] = "ok"
        else:
            status["clip_model"] = "not loaded"
    except Exception as e:
        status["clip_model"] = f"error: {str(e)}"
    return status 