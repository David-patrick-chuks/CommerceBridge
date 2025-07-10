from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, PlainTextResponse
from app.routes import add_product, search
from app.db import get_db
from app.clip_utils import initialize_clip
import logging
import time
import sys

app = FastAPI()

# Metrics storage
metrics = {
    "requests_total": 0,
    "errors_total": 0,
    "start_time": time.time(),
}

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
    # Preload CLIP model
    try:
        model, preprocess = initialize_clip()
        if model is None or preprocess is None:
            raise RuntimeError("CLIP model failed to load.")
        logging.info("CLIP model loaded successfully.")
    except Exception as e:
        logging.error(f"Failed to load CLIP model: {e}")
        sys.exit(1)
    # Test MongoDB connection
    try:
        db = get_db()
        db.command("ping")
        logging.info("MongoDB connection successful.")
    except Exception as e:
        logging.error(f"Failed to connect to MongoDB: {e}")
        sys.exit(1)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    metrics["requests_total"] += 1
    logging.info(f"Incoming request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        metrics["errors_total"] += 1
        logging.exception(f"Error handling request: {request.method} {request.url.path}")
        raise

app.include_router(add_product.router)
app.include_router(search.router)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    metrics["errors_total"] += 1
    logging.warning(f"HTTPException: {exc.status_code} {exc.detail} on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "message": exc.detail},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    metrics["errors_total"] += 1
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

@app.get("/metrics", tags=["Metrics"], summary="Prometheus-style metrics for monitoring")
def metrics_endpoint():
    uptime = int(time.time() - metrics["start_time"])
    prometheus_metrics = f"""
# HELP clipserver_requests_total Total HTTP requests
# TYPE clipserver_requests_total counter
clipserver_requests_total {metrics["requests_total"]}
# HELP clipserver_errors_total Total HTTP errors
# TYPE clipserver_errors_total counter
clipserver_errors_total {metrics["errors_total"]}
# HELP clipserver_uptime_seconds Server uptime in seconds
# TYPE clipserver_uptime_seconds gauge
clipserver_uptime_seconds {uptime}
"""
    return PlainTextResponse(prometheus_metrics.strip(), media_type="text/plain") 