# API Test Script for CLIP Server

This directory contains a standalone API test script (`api_test.py`) for testing your CLIP server's endpoints and product/image search functionality.

## Features
- Adds all products from `images_data/products.json` to the server (uploads all images for each product)
- Runs search queries using images `search1.jpg`, `search2.jpg`, and `search3.jpg` in `images_data/Products/`
- Prints results for health, metrics, add, and search endpoints
- Uses Cloudinary for image storage (see backend requirements)

## Requirements
- Python 3.8+
- `requests` and `cloudinary` Python packages
- CLIP server running (e.g., `uvicorn app.main:app --host 0.0.0.0 --port 8000`)
- All product images and search images present in `images_data/Products/`
- `products.json` in `images_data/` with product definitions (see example below)

## Usage
1. **Start your CLIP server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
2. **Run the test script from the `clip-server` directory:**
   ```bash
   python test/api_test.py
   ```
3. **Review the output:**
   - The script will print the results of each API call and search.

## products.json Example
```json
[
  {
    "name": "Product Name",
    "price": 10000,
    "description": "Product description.",
    "image": [
      "images_data/Products/product1_img1.jpg",
      "images_data/Products/product1_img2.jpg"
    ],
    "category": "Category Name",
    "stock": 10,
    "seller": "SOME_SELLER_ID"
  }
]
```

## Notes
- The script will upload all images for each product to Cloudinary (if configured in the backend).
- The search tests use the images `search1.jpg`, `search2.jpg`, and `search3.jpg` in `images_data/Products/`.
- You can add more products or search images by updating `products.json` and the `SEARCH_IMAGES` list in the script.

---
For more advanced testing or automation, modify `api_test.py` as needed! 