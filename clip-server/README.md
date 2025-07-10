# clip-server

This service provides AI-powered image embedding and hybrid search for CommerceBridge using OpenAI CLIP (ViT-L/14, 768-dim) and a Retrieval-Augmented Generation (RAG) system.

## Features
- Modular FastAPI microservice (see `app/` directory)
- Exposes endpoints for:
  - Adding seller product images and details (embedding, deduplication, storage)
  - Searching for similar products using customer-uploaded images (hybrid vector + keyword search)
- Uses CLIP (**ViT-L/14**, 768-dim) for image embedding (with GPU/CUDA support if available)
- Connects to MongoDB Atlas for storage and vector search
- Handles deduplication, chunking, and metadata integration

## MongoDB Atlas Vector Index
To enable fast vector search, you must create a vector index on the `embedding` field in your products collection. Use the following configuration and set the index name to `product_embedding_vector_index`:

```json
{
  "name": "product_embedding_vector_index",
  "mappings": {
    "dynamic": false,
    "fields": {
      "embedding": {
        "dimensions": 768,
        "similarity": "cosine",
        "type": "knnVector"
      }
    }
  }
}
```

> **Note:** The index must have `dimensions: 768` to match the ViT-L/14 model output.
> The server will use GPU (CUDA) if available, otherwise CPU.

You can create this index in the Atlas UI or via the Atlas CLI/API. The index name is referenced in the code for clarity and future use with $vectorSearch.

## Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Copy `.env.example` to `.env` and fill in your MongoDB Atlas credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```
3. Run the server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

## Endpoints
- `POST /add_product` — Add a new product (image + details)
- `POST /search` — Search for similar products by image
- `GET /` — Health check

See the main monorepo README_IMAGE_MATCHING.md for architecture and integration details. 