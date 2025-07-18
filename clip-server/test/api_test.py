import requests
import os
import json

CLIP_SERVER_URL = "http://localhost:8000"
PRODUCTS_JSON = os.path.join("images_data", "products.json")
SEARCH_IMAGES = [
    os.path.join("images_data", "Products", "search1.jpg"),
    os.path.join("images_data", "Products", "search2.jpg"),
    os.path.join("images_data", "Products", "search3.jpg"),
]

# Load product data from products.json
with open(PRODUCTS_JSON, "r") as f:
    PRODUCTS = json.load(f)

def test_health():
    print("\nTesting GET /")
    resp = requests.get(f"{CLIP_SERVER_URL}/")
    print(resp.status_code, resp.text)

    print("\nTesting GET /health")
    resp = requests.get(f"{CLIP_SERVER_URL}/health")
    print(resp.status_code, resp.text)

    print("\nTesting GET /metrics")
    resp = requests.get(f"{CLIP_SERVER_URL}/metrics")
    print(resp.status_code)
    print(resp.text[:300] + ("..." if len(resp.text) > 300 else ""))

def add_all_products():
    print("\nTesting POST /add_product for all products in products.json")
    for product in PRODUCTS:
        files = [("images", (os.path.basename(img), open(img, "rb"), "image/jpeg")) for img in product["image"]]
        product_data = {
            "name": product["name"],
            "price": product["price"],
            "description": product["description"],
            "category": product["category"],
        }
        resp = requests.post(f"{CLIP_SERVER_URL}/add_product", files=files, data=product_data)
        print(f"Add product '{product['name']}':", resp.status_code, resp.text)

def search_with_images():
    print("\nTesting POST /search with search images")
    for search_img in SEARCH_IMAGES:
        print(f"\nSearching with {search_img}")
        with open(search_img, "rb") as img_file:
            search_resp = requests.post(
                f"{CLIP_SERVER_URL}/search",
                files={"image": (os.path.basename(search_img), img_file, "image/jpeg")},
                data={}
            )
        print(search_resp.status_code)
        print(search_resp.json())

def search_with_queries():
    print("\nTesting POST /search with text queries only")
    queries = [
        "cap",
        "fan",
        "t-shirt",
        "eagle"
    ]
    for q in queries:
        print(f"\nSearching with query: '{q}'")
        resp = requests.post(
            f"{CLIP_SERVER_URL}/search",
            data={"query": q}
        )
        print(resp.status_code)
        print(resp.json())

def search_with_image_and_query():
    print("\nTesting POST /search with both image and text query")
    test_cases = [
        (SEARCH_IMAGES[0], "eagle tshirt"),
        # (SEARCH_IMAGES[1], "t-shirt"),
        # (SEARCH_IMAGES[2], "wrist-watch")
    ]
    for img_path, query in test_cases:
        print(f"\nSearching with image: {img_path} and query: '{query}'")
        with open(img_path, "rb") as img_file:
            search_resp = requests.post(
                f"{CLIP_SERVER_URL}/search",
                files={"image": (os.path.basename(img_path), img_file, "image/jpeg")},
                data={"query": query}
            )
        print(search_resp.status_code)
        print(search_resp.json())

if __name__ == "__main__":
    # test_health()
    # add_all_products()
    # search_with_images()
    # search_with_queries()
    search_with_image_and_query() 