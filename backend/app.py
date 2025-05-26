from flask import Flask, request, jsonify
from flask_cors import CORS
from flask import request
from db import products_col
from db import orders_col

from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route("/products", methods=["GET"])
def get_products():
    search_query = request.args.get("search", "").lower()
    sort_key = request.args.get("sort", "name")  # Default sort by 'name'
    sort_order = request.args.get("order", "asc")  # Default order 'asc'

    query = {}
    if search_query:
        query["name"] = {"$regex": search_query, "$options": "i"}  # Case-insensitive search

    sort_direction = 1 if sort_order == "asc" else -1

    try:
        cursor = products_col.find(query).sort(sort_key, sort_direction)
        products = [
            {
                "id": str(p["_id"]),
                "name": p["name"],
                "category": p.get("category", ""),
                "price": p["price"],
                "image": p.get("image", "")
            }
            for p in cursor
        ]
        return jsonify(products)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Simulated cart stored in memory
cart = []

@app.route("/")
def home():
    return "ShopSphere Backend Running"

@app.route("/add_to_cart", methods=["POST"])
def add_to_cart():
    item = request.json
    cart.append(item)
    return jsonify({"message": "Item added to cart", "cart": cart})

@app.route("/get_cart", methods=["GET"])
def get_cart():
    return jsonify(cart)

@app.route("/apply_discount", methods=["POST"])
def apply_discount():
    data = request.json
    total = data.get("total", 0)
    discount = total * 0.1  # 10% discount
    discounted_total = total - discount
    return jsonify({
        "original": total,
        "discount": discount,
        "final": discounted_total
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
@app.route("/recommend", methods=["GET"])
def recommend():
    # Simple logic based on what’s in cart
    keywords = [item['name'].lower() for item in cart]
    recommendations = []

    if any("sneaker" in name for name in keywords):
        recommendations.append("Running Socks")
    if any("shirt" in name for name in keywords):
        recommendations.append("Tie Clip")

    return jsonify(recommendations or ["Gift Card", "Notebook"])


from flask import request
from datetime import datetime
from db import orders_col  # Make sure this is imported

@app.route("/checkout", methods=["POST"])
def checkout():
    try:
        data = request.get_json()
        cart = data.get("cart", [])
        if not cart:
            return jsonify({"error": "Cart is empty"}), 400

        order = {
            "items": cart,
            "total": sum(item["price"] for item in cart),
            "timestamp": datetime.utcnow()
        }

        orders_col.insert_one(order)
        return jsonify({"message": "✅ Order placed"}), 200
    except Exception as e:
        print("Checkout error:", e)
        return jsonify({"error": "❌ Failed to place order"}), 500
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db import users_col

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if users_col.find_one({"username": username}):
        return jsonify({"error": "Username already exists"}), 400

    hashed_pw = generate_password_hash(password)
    users_col.insert_one({"username": username, "password": hashed_pw})
    return jsonify({"message": "✅ Registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users_col.find_one({"username": data.get("username")})

    if user and check_password_hash(user["password"], data.get("password")):
        return jsonify({"message": "✅ Login successful"}), 200
    return jsonify({"error": "Invalid credentials"}), 401
