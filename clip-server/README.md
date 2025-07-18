# CLIP Server API

This service provides advanced image-based product search and catalog management for CommerceBridge and similar e-commerce platforms. It enables you to add products with images and search for products visually using simple HTTP APIs.

---

## Features
- Add products with multiple images and rich details
- Search for products by uploading an image
- Fast, accurate, and scalable
- Simple, standards-based HTTP API

---

## AI-Powered Retrieval-Augmented Generation (RAG)

This service leverages advanced Retrieval-Augmented Generation (RAG) techniques to deliver highly accurate and context-aware image-based product search. By combining robust retrieval methods with a state-of-the-art AI model, the system can:
- Understand and match product images with exceptional precision
- Enhance catalog management through intelligent image and metadata analysis
- Support complex queries by integrating visual and textual information
- Continuously improve search relevance and user experience

The underlying AI model is designed for enterprise-grade reliability, security, and scalability. It enables seamless integration with e-commerce workflows, ensuring that product discovery and catalog operations are both efficient and secure. All AI operations are performed in compliance with industry best practices for data privacy and integrity.

---

## Quick Start
1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Configure environment:**
   - Copy `.env.example` to `.env` and fill in your database and Cloudinary credentials.
3. **Run the server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

---

## API Endpoints

### Health & Metrics
- `GET /` — Health check
- `GET /health` — Detailed health status
- `GET /metrics` — Service metrics

### Product Management
- `POST /add_product` — Add a new product with images and details
  - **Form fields:** `name`, `price`, `description`, `category`
  - **Files:** Multiple images as `images`
- `POST /search` — Search for products by image
  - **Files:** One image as `image`
  - **Optional:** `query` (text)

---

## Usage Notes
- All product images are stored securely in the cloud.
- The API is designed for seamless integration with CommerceBridge and other e-commerce solutions.
- For best results, use high-quality product images.

---

## Support
For integration help or questions, contact the CommerceBridge development team.

> **Note:** This service is intended for internal use and integration. For more details, see the main project documentation. 