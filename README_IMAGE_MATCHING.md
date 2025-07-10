# CommerceBridge: AI-Powered Image-Based Product Matching (CLIP + RAG)

## Overview
This update introduces advanced image search and matching to CommerceBridge, enabling sellers to upload product images and customers to find products by uploading their own images via WhatsApp. The system uses OpenAI CLIP for image embeddings, a hybrid Retrieval-Augmented Generation (RAG) system for search, and MongoDB Atlas for vector and keyword search.

---

## Monorepo Structure

```
commerce-bridge/
├── backend/         # Node.js WhatsApp bot, API, business logic
├── frontend/        # React web interface
├── shared/          # (Optional) Shared types/utilities
├── clip-server/     # NEW: Python FastAPI server for CLIP embedding & RAG search
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

### 2. Python FastAPI Server (`clip-server/`)
- Place all Python code for CLIP embedding and RAG search in this directory.
- Install dependencies:
  ```bash
  pip install fastapi uvicorn torch clip-by-openai pymongo pillow nltk scikit-learn
  ```
- Run the server:
  ```bash
  uvicorn server:app --host 0.0.0.0 --port 8000
  ```

### 3. Node.js WhatsApp Bot (`backend/`)
- Integrate image upload and search endpoints to communicate with the Python server.
- Install dependencies:
  ```bash
  npm install whatsapp-web.js qrcode-terminal axios form-data
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

## Notes
- **Buttons/Quick Replies**: As of 2025, WhatsApp has deprecated classic buttons. Use plain text or lists for interactivity, or migrate to the WhatsApp Business API for advanced features.
- **Scalability**: MongoDB Atlas vector search is optimized for large catalogs.
- **Security**: All uploads and API endpoints should be secured in production.
- **Extensibility**: The architecture supports future integration with pricing intelligence, external metadata, and more.

---

## Next Steps
- Implement the Node.js and Python components as described.
- Test end-to-end flows for both sellers and customers.
- Monitor MongoDB Atlas for performance and deduplication.
- Consider production hardening (security, error handling, scaling).

---

For more details, see the implementation and code comments in the project. 