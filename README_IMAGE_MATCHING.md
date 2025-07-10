# CommerceBridge: AI-Powered Image-Based Product Matching (CLIP + RAG)

> **This document is a technical deep-dive. For a high-level overview, see the main [README.md](./README.md) and [PROJECT_VISION.md](./PROJECT_VISION.md).**

## Overview
CommerceBridge enables sellers to upload product images and customers to find products by uploading their own images via WhatsApp. The system uses OpenAI CLIP for image embeddings, a hybrid Retrieval-Augmented Generation (RAG) system for search, and MongoDB Atlas for vector and keyword search. This feature is a core differentiator of CommerceBridge and is fully integrated with the WhatsApp-first shopping experience (via WhatsApp Web JS, not WhatsApp Business API).

---

## Monorepo Structure

```
commerce-bridge/
├── backend/         # Node.js WhatsApp bot, API, business logic
├── frontend/        # React web interface
├── shared/          # (Optional) Shared types/utilities
├── clip-server/     # Python FastAPI server for CLIP embedding & RAG search
└── README_IMAGE_MATCHING.md  # (This file)
```

---

## Key Features
- **Image Embedding with CLIP**: Seller and customer images are embedded using the CLIP model for semantic similarity.
- **Hybrid RAG Search**: Combines vector (semantic) and keyword (lexical) search for best results.
- **Content Deduplication**: SHA256 hashing prevents duplicate product images in the catalog.
- **Agent Metadata Integration**: Product responses can include context-aware metadata from external sources.
- **Intelligent Chunking**: Product descriptions are chunked for better retrieval and context preservation.
- **Dynamic Retrieval Configuration**: Tune K-values, similarity thresholds, and confidence scores for search.
- **Compression**: Gzip compression for efficient WhatsApp communication.
- **Database Optimization**: Uses MongoDB Atlas with vector search and text indexes for fast, scalable queries.

---

## Architecture
- **Node.js WhatsApp Bot** (`backend/`):
  - Handles WhatsApp interactions, receives images and product details from sellers, and images from customers.
  - Communicates with the Python FastAPI server for embedding and search.
- **Python FastAPI Server** (`clip-server/`):
  - Runs CLIP for image embedding.
  - Implements hybrid RAG search and deduplication.
  - Connects to MongoDB Atlas for storage and retrieval.
- **MongoDB Atlas**:
  - Stores product data, embeddings, and metadata.
  - Provides vector and text search capabilities.

---

## Workflow
1. **Seller Flow**:
    - Seller sends `/seller` to the bot.
    - Uploads a product image.
    - Provides product name, price, and description.
    - Bot sends data to Python server, which embeds, deduplicates, and stores the product.

2. **Customer Flow**:
    - Customer sends `/customer` to the bot.
    - Uploads an image of a product they want to find.
    - Bot sends image to Python server, which embeds and searches for matches.
    - Bot returns top matches with product details.

3. **Matching & Interactivity**:
    - Customers receive product matches with details and options (e.g., “View Details”, “Add to Cart”).

---

## Technologies Used
- **Node.js** (`whatsapp-web.js`, `axios`, `form-data`)
- **Python** (`fastapi`, `torch`, `clip-by-openai`, `pymongo`, `nltk`, `scikit-learn`)
- **MongoDB Atlas** (vector search, text index)
- **OpenAI CLIP** (ViT-B/32)
- **SHA256** (deduplication)
- **Gzip** (compression)

---

## Setup & Deployment

### 1. MongoDB Atlas
- Create a `commercebridge` database and `products` collection.
- Create a vector search index and text index as described in the implementation.
- Example vector index config:
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

### 2. Python FastAPI Server (`clip-server/`)
- Place all Python code for CLIP embedding and RAG search in this directory.
- Install dependencies:
  ```bash
  pip install -r requirements.txt
  ```
- Copy `.env.example` to `.env` and fill in your MongoDB Atlas credentials.
- Run the server:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8000
  ```

### 3. Node.js WhatsApp Bot (`backend/`)
- Integrate image upload and search endpoints to communicate with the Python server.
- Install dependencies:
  ```bash
  npm install
  ```
- Run the bot:
  ```bash
  npm run dev
  ```

---

## Example User Flows

### Seller
1. `/seller` → “Please send the product image.”
2. Upload image → “Please provide the product name.”
3. Enter name → “Please provide the price.”
4. Enter price → “Please provide the product description.”
5. Enter description → “Product added successfully!”

### Customer
1. `/customer` → “Please send an image to find similar products.”
2. Upload image → Bot returns top matches with details and options.

---

## Security, Scalability & Extensibility Notes
- All uploads and API endpoints should be secured in production.
- Use HTTPS for all communications.
- Deduplication is enforced via SHA256 hashing of images.
- The architecture supports future integration with pricing intelligence, external metadata, and more.
- Monitor MongoDB Atlas for performance and deduplication.
- Consider production hardening (security, error handling, scaling).
- WhatsApp Web JS is used for integration (not WhatsApp Business API).

---

## Next Steps
- Implement the Node.js and Python components as described.
- Test end-to-end flows for both sellers and customers.
- Monitor MongoDB Atlas for performance and deduplication.
- Consider production hardening (security, error handling, scaling).

---

For a high-level overview, see the main [README.md](./README.md) and [PROJECT_VISION.md](./PROJECT_VISION.md). 