import os
import json
import sqlite3
import datetime
import smtplib
from email.mime.text import MIMEText
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt


app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_super_secret_key_change_in_prod')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'shopsphere.db')

# ----------------- SQLITE UTILITIES -----------------
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def db_query(query, args=(), one=False, commit=False):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(query, args)
        if commit:
            conn.commit()
            result = cursor.lastrowid
        else:
            rv = cursor.fetchall()
            result = (rv[0] if rv else None) if one else rv
            if result is not None:
                if isinstance(result, sqlite3.Row):
                    result = dict(result)
                elif isinstance(result, list):
                    result = [dict(row) for row in result]
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()
    return result

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Create tables if they do not exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            xp INTEGER DEFAULT 0,
            points INTEGER DEFAULT 0,
            badges TEXT DEFAULT '[]',
            streak INTEGER DEFAULT 1,
            last_active TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            price REAL NOT NULL,
            stock INTEGER NOT NULL,
            image TEXT,
            retailer_id INTEGER NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            email TEXT,
            cart_json TEXT NOT NULL,
            total REAL NOT NULL,
            status TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            user_id INTEGER,
            username TEXT NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Dynamic schema upgrades for old sqlite tables
    # Check for xp
    try:
        cursor.execute("SELECT xp FROM users LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0")
    
    # Check for points
    try:
        cursor.execute("SELECT points FROM users LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 0")
        
    # Check for badges
    try:
        cursor.execute("SELECT badges FROM users LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE users ADD COLUMN badges TEXT DEFAULT '[]'")
        
    # Check for streak
    try:
        cursor.execute("SELECT streak FROM users LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE users ADD COLUMN streak INTEGER DEFAULT 1")
        
    # Check for last_active
    try:
        cursor.execute("SELECT last_active FROM users LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE users ADD COLUMN last_active TEXT")
        
    # Check for mobile
    try:
        cursor.execute("SELECT mobile FROM users LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE users ADD COLUMN mobile TEXT")
        
    # Check for email
    try:
        cursor.execute("SELECT email FROM users LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")

    # Check for cost_price in products
    try:
        cursor.execute("SELECT cost_price FROM products LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE products ADD COLUMN cost_price REAL")
        conn.commit()
        
    # Check for sizes in products
    try:
        cursor.execute("SELECT sizes FROM products LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE products ADD COLUMN sizes TEXT DEFAULT 'unisized'")
        conn.commit()

    # Check for description in products
    try:
        cursor.execute("SELECT description FROM products LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE products ADD COLUMN description TEXT")
        conn.commit()

    # Check for shipping_address in orders
    try:
        cursor.execute("SELECT shipping_address FROM orders LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE orders ADD COLUMN shipping_address TEXT")
        conn.commit()
        
    conn.commit()
    conn.close()
    
    seed_products_if_empty()
    seed_reviews_if_empty()

def seed_products_if_empty():
    count = db_query("SELECT COUNT(*) as cnt FROM products", one=True)
    if count and count["cnt"] > 0:
        return
        
    products = [
        # Electronics
        ("Cyberpunk Headphones", "Electronics", 2999.00, 15, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80", 1, 3999.00, "unisized", "High-fidelity immersive audio experience with cybernetic designs, active noise cancellation, and 40-hour long-lasting battery life."),
        ("Smart Watch Series 9", "Electronics", 4999.00, 20, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80", 1, 5999.00, "unisized", "Next-gen wellness tracking watch. Monitors blood oxygen levels, heart rates, sleep analytics, and features an ultra-bright AMOLED touch display."),
        ("Ultra Slim Laptop", "Electronics", 59999.00, 8, "https://images.unsplash.com/photo-1496181130204-755241524eab?w=500&q=80", 1, 69999.00, "unisized", "Power-packed lightweight laptop. Features 16GB RAM, 512GB NVMe SSD, and high-performance processing capability designed for modern creators."),
        ("Mechanical Keyboard", "Electronics", 1999.00, 30, "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80", 1, 2499.00, "unisized", "Satisfying clicky tactile mechanical switches. Includes vibrant custom RGB backlighting profiles and ergonomic key layout."),
        
        # Clothing
        ("Classic Denim Jacket", "Clothing", 1499.00, 25, "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&q=80", 1, 1999.00, "S, M, L, XL", "Durable pre-washed organic blue denim material. Features metal button closures, standard fit, and double breast pockets."),
        ("Casual Cotton T-Shirt", "Clothing", 499.00, 50, "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80", 1, 699.00, "S, M, L, XL", "Breathable 100% combed cotton classic crewneck t-shirt. Ideal for casual, everyday streetwear styling."),
        ("Warm Winter Hoodie", "Clothing", 1199.00, 15, "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&q=80", 1, 1599.00, "S, M, L, XL", "Cozy heavy fleece inner lining hoodie with drawstring adjustments and front hand-warmer pocket partitions."),
        
        # Grocery
        ("Capsicum-Green", "Grocery", 80.00, 100, "https://www.bbassets.com/media/uploads/p/m/10000067_26-fresho-capsicum-green.jpg?tr=w-154,q-80", 1, 95.00, "unisized", "Fresh, crisp organic green capsicums. Handpicked daily from local farms for culinary freshness."),
        ("Carrot-Orange", "Grocery", 38.00, 100, "https://www.bbassets.com/media/uploads/p/m/10000070_16-fresho-carrot-orange.jpg?tr=w-154,q-80", 1, 45.00, "unisized", "Sweet, crunchy fresh orange carrots. Loaded with vitamin-A nutrients, ideal for salads or juices."),
        ("Apple Washington", "Grocery", 280.00, 80, "https://www.bbassets.com/media/uploads/p/m/40119549_1-fresho-apple-washington-113-count.jpg?tr=w-154,q-80", 1, 320.00, "unisized", "Imported crispy sweet Washington red apples. Nutrient dense, delicious, and fresh snack picks."),
        ("Moong Dal Regular", "Grocery", 159.80, 50, "https://www.bbassets.com/media/uploads/p/m/40133880_1-institutional-moong-dal-regular.jpg?tr=w-154,q-80", 1, 180.00, "unisized", "High protein organic hulled yellow split mung lentils. Essential for daily dietary cooking."),
        ("Heritage Cow Ghee", "Grocery", 621.00, 40, "https://www.bbassets.com/media/uploads/p/m/40268426_2-heritage-cow-ghee-rich-in-vitamins-minerals-healthy-taste.jpg?tr=w-154,q-80", 1, 699.00, "unisized", "Aromatic premium cow ghee prepared using age-old traditional recipes. Loaded with essential fats and vitamins."),
        
        # Home & Furniture
        ("Ergonomic Office Chair", "Home & Furniture", 6999.00, 10, "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&q=80", 1, 8999.00, "unisized", "Premium lumbar support mesh office chair. Features height adjustment controls, 360-degree swivel, and comfortable armrests."),
        ("Minimalist Desk Lamp", "Home & Furniture", 999.00, 15, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80", 1, 1299.00, "unisized", "Sleek eye-friendly LED desk lamp. Features touch brightness controls and adjustable neck angling positions."),
        ("Ceramic Flower Vase", "Home & Furniture", 599.00, 35, "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&q=80", 1, 799.00, "unisized", "Hand-molded stylish ceramic flower vase. Perfectly enhances modern kitchen counters or living room corner tables."),
        
        # Books & Education
        ("Science Fiction Novel", "Books & Education", 399.00, 45, "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&q=80", 1, 499.00, "unisized", "Award-winning futuristic space thriller novel. A mind-bending exploration of galactic civilizations and space time warp travels."),
        ("Python Programming Guide", "Books & Education", 799.00, 20, "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&q=80", 1, 999.00, "unisized", "Master Python programming from scratch. Covers data structures, object-oriented concepts, algorithms, and real-world projects."),
        ("Drawing Sketchbook", "Books & Education", 299.00, 60, "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&q=80", 1, 399.00, "unisized", "Premium 120-GSM heavy acid-free drawing sheets. Supports dry sketching media, color pencils, and water paint sweeps.")
    ]
    
    for name, cat, price, stock, img, ret_id, cost, szs, desc in products:
        db_query(
            "INSERT INTO products (name, category, price, stock, image, retailer_id, cost_price, sizes, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (name, cat, price, stock, img, ret_id, cost, szs, desc),
            commit=True
        )
    print("✅ Seeded products table successfully.")

def seed_reviews_if_empty():
    count = db_query("SELECT COUNT(*) as cnt FROM reviews", one=True)
    if count and count["cnt"] > 0:
        return
        
    reviews = [
        (1, 1, "Alice", 5, "Unbelievable sound quality! Battery lasts forever. Highly recommend!"),
        (1, 2, "Bob", 4, "Really comfortable for long gaming sessions, fits perfectly."),
        (2, 3, "Charlie", 5, "Sleek look, tracks metrics accurately, notifications are fast."),
        (2, 1, "Alice", 4, "Excellent watch, battery is okay but charges extremely fast."),
        (3, 2, "Bob", 5, "Ultra fast laptop, screen is beautiful. Perfect for coding!"),
        (4, 3, "Charlie", 4, "Key clicks feel awesome, beautiful RGB backlights."),
        (5, 1, "Alice", 5, "Very warm and stylish denim jacket. Fits true to size."),
        (5, 2, "Bob", 4, "Good quality fabric, holds up well in wash.")
    ]
    for product_id, user_id, username, rating, comment in reviews:
        db_query(
            "INSERT INTO reviews (product_id, user_id, username, rating, comment) VALUES (?, ?, ?, ?, ?)",
            (product_id, user_id, username, rating, comment),
            commit=True
        )
    print("✅ Seeded reviews table successfully.")


# ----------------- EMAIL SETUP -----------------
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USER = os.environ.get('EMAIL_USER', "shneh2004@gmail.com")
EMAIL_PASS = os.environ.get('EMAIL_PASS', "shknoetvksoejfpw")

def send_order_email(to_email, order_items, total):
    try:
        cart_items = "\n".join([
            f"{item.get('name', 'Item')} x {item.get('quantity', 1)} - ₹{item.get('price', 0)}"
            for item in order_items
        ])
        body = f"🛒 Your order has been placed successfully:\n\n{cart_items}\n\nTotal: ₹{total}\n\nThank you for shopping at ShopSphere!"
        msg = MIMEText(body)
        msg['Subject'] = "✅ Your ShopSphere Order"
        msg['From'] = EMAIL_USER
        msg['To'] = to_email

        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
    except Exception as e:
        print("Mocked/Failed to send email:", e)


# ----------------- JWT DECORATORS -----------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
        try:
            token = token.split(" ")[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            user = db_query("SELECT * FROM users WHERE id = ?", (int(data['user_id']),), one=True)
            if not user:
                raise Exception("User not found")
        except Exception as e:
            return jsonify({'error': 'Token is invalid!'}), 401
        return f(user, *args, **kwargs)
    return decorated

def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.get('role', 'user') not in allowed_roles:
                return jsonify({'error': 'You do not have permission to perform this action'}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator


# ----------------- AUTH ENDPOINTS -----------------
# Store OTPs in memory: { email: {"otp": otp, "expiry": datetime, "verified": bool} }
email_otp_store = {}

@app.route('/auth/send-email-otp', methods=['POST'])
def send_email_otp():
    data = request.get_json() or {}
    email = data.get("email")
    if not email or "@" not in email:
        return jsonify({"error": "Invalid email address."}), 400
        
    import random
    otp = str(random.randint(100000, 999999))
    expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    email_otp_store[email] = {"otp": otp, "expiry": expiry, "verified": False}
    
    is_real = False
    email_error = None
    
    if EMAIL_USER and EMAIL_PASS:
        try:
            body = f"🔒 Your ShopSphere verification code is: {otp}\n\nThis code is valid for 10 minutes."
            msg = MIMEText(body)
            msg['Subject'] = "🔒 ShopSphere Verification Code"
            msg['From'] = EMAIL_USER
            msg['To'] = email
            
            with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=5) as server:
                server.starttls()
                server.login(EMAIL_USER, EMAIL_PASS)
                server.send_message(msg)
            is_real = True
            print(f"✅ Real OTP email sent to {email}")
        except Exception as e:
            email_error = str(e)
            print(f"❌ Failed to send OTP email via SMTP, falling back to mock sandbox: {e}")
            
    if is_real:
        return jsonify({
            "message": "OTP sent successfully to your email!",
            "real_time": True
        })
    else:
        print("=======================================")
        print(f"[EMAIL SANDBOX MOCK] Sent OTP {otp} to {email}")
        print("=======================================")
        response_data = {
            "message": "OTP sent successfully! (Sandbox Mode)",
            "demo_otp": otp,
            "real_time": False
        }
        if email_error:
            response_data["smtp_error"] = email_error
        return jsonify(response_data)


@app.route('/auth/verify-email-otp', methods=['POST'])
def verify_email_otp():
    data = request.get_json() or {}
    email = data.get("email")
    otp = data.get("otp")
    
    if not email or not otp:
        return jsonify({"error": "Missing email or OTP"}), 400
        
    record = email_otp_store.get(email)
    if not record:
        return jsonify({"error": "OTP not requested or expired"}), 400
        
    if datetime.datetime.utcnow() > record["expiry"]:
        del email_otp_store[email]
        return jsonify({"error": "OTP has expired. Please request a new one."}), 400
        
    if record["otp"] != otp:
        return jsonify({"error": "Invalid OTP code"}), 400
        
    record["verified"] = True
    return jsonify({"message": "Email verified successfully!"})


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "user")
    mobile = data.get("mobile")
    email = data.get("email")
    
    if not username or not password or not mobile or not email:
        return jsonify({"error": "Missing username, password, mobile number, or email address"}), 400

    # Enforce Email verification
    record = email_otp_store.get(email)
    if not record or not record.get("verified"):
        return jsonify({"error": "Email address has not been verified! Verify OTP first."}), 400

    existing = db_query("SELECT id FROM users WHERE username = ?", (username,), one=True)
    if existing:
        return jsonify({"error": "Username already exists"}), 400

    hashed_pw = generate_password_hash(password)
    
    # Grant initial loyalty setup
    initial_xp = 100
    initial_points = 50
    initial_badges = json.dumps(["welcome"])
    
    user_id = db_query(
        "INSERT INTO users (username, password, role, xp, points, badges, streak, mobile, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (username, hashed_pw, role, initial_xp, initial_points, initial_badges, 1, mobile, email),
        commit=True
    )
    
    # Cleanup OTP store
    if email in email_otp_store:
        del email_otp_store[email]
        
    return jsonify({"message": "✅ Registered successfully", "user_id": user_id}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    
    user = db_query("SELECT * FROM users WHERE username = ?", (username,), one=True)
    
    if user and check_password_hash(user["password"], password):
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        # If jwt.encode outputs as bytes, convert to string
        if isinstance(token, bytes):
            token = token.decode('utf-8')
            
        return jsonify({
            "token": token,
            "user": {
                "id": user["id"], 
                "username": user["username"], 
                "role": user["role"],
                "xp": user["xp"],
                "points": user["points"],
                "badges": json.loads(user["badges"])
            }
        }), 200
        
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({
        "id": current_user['id'], 
        "username": current_user["username"], 
        "role": current_user["role"],
        "xp": current_user["xp"],
        "points": current_user["points"],
        "badges": json.loads(current_user["badges"])
    })


# ----------------- PRODUCT ENDPOINTS -----------------
@app.route("/products", methods=["GET"])
def get_products():
    search = request.args.get("search", "")
    category = request.args.get("category", "")
    
    query = "SELECT * FROM products WHERE 1=1"
    params = []
    
    if category and category != "All":
        query += " AND category = ?"
        params.append(category)
        
    products = db_query(query, tuple(params))
    
    if search and search.strip():
        try:
            from ml_engine import get_semantic_search_results
            products = get_semantic_search_results(search, products)
        except Exception as e:
            app.logger.error(f"Error ranking products: {e}")
            
    return jsonify(products)

@app.route("/products/<int:product_id>", methods=["GET"])
def get_single_product(product_id):
    prod = db_query("SELECT * FROM products WHERE id = ?", (product_id,), one=True)
    if not prod:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(prod)

@app.route("/products/<int:product_id>/ai-verdict", methods=["GET"])
def get_product_verdict(product_id):
    prod = db_query("SELECT * FROM products WHERE id = ?", (product_id,), one=True)
    if not prod:
        return jsonify({"error": "Product not found"}), 404
        
    try:
        from ml_engine import generate_ai_verdict
        verdict = generate_ai_verdict(prod)
    except Exception as e:
        verdict = f"🤖 **AI Match Quality: 95%**\n\nExcellent fit and build specifications. Matches standard catalog criteria."
        app.logger.error(f"Error generating verdict: {e}")
        
    return jsonify({"verdict": verdict})

@app.route("/products", methods=["POST"])
@token_required
@role_required('retailer', 'admin')
def add_product(current_user):
    data = request.json
    name = data.get("name")
    price = float(data.get("price", 0))
    stock = int(data.get("stock", 0))
    category = data.get("category", "Uncategorized")
    image = data.get("image", "")
    retailer_id = current_user["id"]
    
    cost_price = float(data.get("cost_price", price * 1.25))
    sizes = data.get("sizes", "unisized")
    description = data.get("description", "Premium product curated by ShopSphere.")
    
    # Gain 50 XP for listing a product!
    db_query("UPDATE users SET xp = xp + 50 WHERE id = ?", (current_user["id"],), commit=True)
    
    prod_id = db_query(
        "INSERT INTO products (name, category, price, stock, image, retailer_id, cost_price, sizes, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (name, category, price, stock, image, retailer_id, cost_price, sizes, description),
        commit=True
    )
    return jsonify({"message": "Product added", "product": {"id": prod_id}}), 201

@app.route("/products/<int:product_id>", methods=["PUT"])
@token_required
@role_required('retailer', 'admin')
def update_product(current_user, product_id):
    data = request.json
    prod = db_query("SELECT * FROM products WHERE id = ?", (product_id,), one=True)
    
    if not prod:
        return jsonify({"error": "Not found"}), 404
        
    if current_user["role"] == "retailer" and prod["retailer_id"] != current_user["id"]: 
        return jsonify({"error": "Not yours"}), 403

    name = data.get("name", prod["name"])
    category = data.get("category", prod["category"])
    price = float(data.get("price", prod["price"]))
    stock = int(data.get("stock", prod["stock"]))
    image = data.get("image", prod["image"])
    cost_price = float(data.get("cost_price", prod["cost_price"] if prod["cost_price"] is not None else price * 1.25))
    sizes = data.get("sizes", prod["sizes"] if prod["sizes"] is not None else 'unisized')
    description = data.get("description", prod["description"] if prod["description"] is not None else 'Premium product curated by ShopSphere.')
    
    db_query(
        "UPDATE products SET name = ?, category = ?, price = ?, stock = ?, image = ?, cost_price = ?, sizes = ?, description = ? WHERE id = ?",
        (name, category, price, stock, image, cost_price, sizes, description, product_id),
        commit=True
    )
    return jsonify({"message": "Updated"})

@app.route("/products/<int:product_id>", methods=["DELETE"])
@token_required
@role_required('retailer', 'admin')
def delete_product(current_user, product_id):
    prod = db_query("SELECT * FROM products WHERE id = ?", (product_id,), one=True)
    
    if not prod:
        return jsonify({"error": "Not found"}), 404
        
    if current_user["role"] == "retailer" and prod["retailer_id"] != current_user["id"]: 
        return jsonify({"error": "Not yours"}), 403
    
    db_query("DELETE FROM products WHERE id = ?", (product_id,), commit=True)
    return jsonify({"message": "Deleted"})


# ----------------- ORDER ENDPOINTS -----------------
@app.route("/orders", methods=["GET"])
@token_required
def get_orders(current_user):
    if current_user['role'] == 'user':
        orders = db_query("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC", (current_user['id'],))
    else:
        orders = db_query("SELECT * FROM orders ORDER BY id DESC")
        
    for o in orders:
        try:
            o['cart'] = json.loads(o['cart_json'])
        except Exception:
            o['cart'] = []
        try:
            o['shipping_address'] = json.loads(o['shipping_address']) if o['shipping_address'] else None
        except Exception:
            o['shipping_address'] = None
            
    return jsonify(orders)

@app.route("/checkout", methods=["POST"])
@token_required
def perform_checkout(current_user):
    data = request.get_json() or {}
    cart = data.get("cart", [])
    total = data.get("total", 0)
    email = data.get("email", current_user["username"])
    shipping_addr_raw = data.get("shipping_address", {})

    if not cart:
        return jsonify({"error": "Empty cart"}), 400

    for item in cart:
        if 'id' in item:
            db_query(
                "UPDATE products SET stock = stock - ? WHERE id = ?",
                (int(item.get('quantity', 1)), int(item['id'])),
                commit=True
            )

    # Gamification increments: 1 XP per Rupee + 150 Checkout bonus
    xp_gained = int(total) + 150
    points_gained = 15
    
    # Process badges
    badges = json.loads(current_user["badges"])
    unlocked_new_badge = False
    
    if "first_purchase" not in badges:
        badges.append("first_purchase")
        unlocked_new_badge = True
        xp_gained += 200
        
    if total > 1000 and "high_roller" not in badges:
        badges.append("high_roller")
        unlocked_new_badge = True
        xp_gained += 300

    cart_json = json.dumps(cart)
    shipping_address_json = json.dumps(shipping_addr_raw)
    
    order_id = db_query(
        "INSERT INTO orders (user_id, email, cart_json, total, status, shipping_address) VALUES (?, ?, ?, ?, ?, ?)",
        (current_user["id"], email, cart_json, total, "paid", shipping_address_json),
        commit=True
    )
    
    db_query(
        "UPDATE users SET xp = xp + ?, points = points + ?, badges = ? WHERE id = ?",
        (xp_gained, points_gained, json.dumps(badges), current_user["id"]),
        commit=True
    )
    
    if email:
        send_order_email(email, cart, total)
        
    return jsonify({
        "message": "Order placed!",
        "order_id": order_id,
        "xp_gained": xp_gained,
        "points_gained": points_gained,
        "unlocked_new_badge": unlocked_new_badge,
        "badges": badges
    })

@app.route("/create-checkout-session", methods=["POST"])
@token_required
def create_checkout_session(current_user):
    return jsonify({"clientSecret": "pi_mock", "redirect_url": "/checkout-success"})


# ----------------- REVIEWS ENDPOINTS -----------------
@app.route("/products/<int:product_id>/reviews", methods=["GET"])
def get_product_reviews(product_id):
    reviews = db_query("SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC", (product_id,))
    return jsonify(reviews)

@app.route("/products/<int:product_id>/reviews", methods=["POST"])
@token_required
def add_product_review(current_user, product_id):
    data = request.json or {}
    rating = int(data.get("rating", 5))
    comment = data.get("comment", "").strip()
    
    if not comment:
        return jsonify({"error": "Comment is required"}), 400
        
    db_query(
        "INSERT INTO reviews (product_id, user_id, username, rating, comment) VALUES (?, ?, ?, ?, ?)",
        (product_id, current_user["id"], current_user["username"], rating, comment),
        commit=True
    )
    return jsonify({"message": "Review posted successfully!"}), 201


# ----------------- GAMIFICATION ENDPOINTS -----------------
@app.route("/user/spin", methods=["POST"])
@token_required
def user_spin(current_user):
    cost = 30
    if current_user["points"] < cost:
        if current_user["xp"] < 300: # Help new users
            cost = 0
        else:
            return jsonify({"error": "Insufficient points! Spin costs 30 points."}), 400
            
    import random
    rewards = [
        {"type": "discount", "value": 5, "label": "5% Discount", "code": "SPIN5"},
        {"type": "discount", "value": 10, "label": "10% Discount", "code": "SPIN10"},
        {"type": "discount", "value": 15, "label": "15% Discount", "code": "SPIN15"},
        {"type": "xp", "value": 100, "label": "100 XP Bonus", "code": ""},
        {"type": "xp", "value": 250, "label": "250 XP Bonus", "code": ""},
        {"type": "points", "value": 50, "label": "50 Points Refill", "code": ""}
    ]
    
    reward = random.choice(rewards)
    xp_change = 0
    points_change = -cost
    
    if reward["type"] == "xp":
        xp_change = reward["value"]
    elif reward["type"] == "points":
        points_change += reward["value"]
        
    # Check if they get Coupon King badge
    badges = json.loads(current_user["badges"])
    unlocked_badge = False
    if reward["type"] == "discount" and "coupon_king" not in badges:
        badges.append("coupon_king")
        unlocked_badge = True
        xp_change += 200

    db_query(
        "UPDATE users SET xp = xp + ?, points = points + ?, badges = ? WHERE id = ?",
        (xp_change, points_change, json.dumps(badges), current_user["id"]),
        commit=True
    )
    
    updated = db_query("SELECT xp, points, badges FROM users WHERE id = ?", (current_user["id"],), one=True)
    
    return jsonify({
        "reward": reward,
        "xp": updated["xp"],
        "points": updated["points"],
        "badges": json.loads(updated["badges"]),
        "unlocked_badge": unlocked_badge
    })

@app.route("/user/claim-badge", methods=["POST"])
@token_required
def claim_badge(current_user):
    badge_name = request.json.get("badge")
    badges = json.loads(current_user["badges"])
    
    if badge_name not in badges:
        badges.append(badge_name)
        db_query(
            "UPDATE users SET badges = ?, xp = xp + 150 WHERE id = ?",
            (json.dumps(badges), current_user["id"]),
            commit=True
        )
        
    updated = db_query("SELECT xp, points, badges FROM users WHERE id = ?", (current_user["id"],), one=True)
    return jsonify({
        "message": f"Badge {badge_name} claimed", 
        "badges": json.loads(updated["badges"]),
        "xp": updated["xp"]
    })

@app.route("/user/daily-checkin", methods=["POST"])
@token_required
def daily_checkin(current_user):
    today = datetime.date.today().isoformat()
    last_active = current_user.get("last_active")
    
    streak = current_user.get("streak", 1)
    if last_active:
        try:
            last_active_date = datetime.date.fromisoformat(last_active)
            time_diff = datetime.date.today() - last_active_date
            if time_diff.days == 1:
                streak += 1
            elif time_diff.days > 1:
                streak = 1
            else:
                # Already checked in today
                return jsonify({"error": "Already checked in today!"}), 400
        except Exception:
            streak = 1
    else:
        streak = 1
        
    xp_bonus = min(streak, 7) * 50
    points_bonus = 25
    
    badges = json.loads(current_user["badges"])
    unlocked_badge = False
    if streak >= 3 and "streak_hero" not in badges:
        badges.append("streak_hero")
        unlocked_badge = True
        xp_bonus += 200
        
    db_query(
        "UPDATE users SET xp = xp + ?, points = points + ?, streak = ?, last_active = ?, badges = ? WHERE id = ?",
        (xp_bonus, points_bonus, streak, today, json.dumps(badges), current_user["id"]),
        commit=True
    )
    
    updated = db_query("SELECT xp, points, badges, streak, last_active FROM users WHERE id = ?", (current_user["id"],), one=True)
    return jsonify({
        "message": "Daily check-in successful!",
        "xp_gained": xp_bonus,
        "points_gained": points_bonus,
        "streak": updated["streak"],
        "unlocked_badge": unlocked_badge,
        "xp": updated["xp"],
        "points": updated["points"],
        "badges": json.loads(updated["badges"])
    })

@app.route("/recommend", methods=["GET"])
def get_recommendations():
    product_id = request.args.get("product_id")
    user_id = request.args.get("user_id")
    
    # Get all products and orders
    products = db_query("SELECT * FROM products")
    orders = db_query("SELECT * FROM orders")
    
    try:
        from ml_engine import get_hybrid_recommendations, get_personalized_recommendations
        
        if product_id:
            try:
                prod_id_int = int(product_id)
                recs = get_hybrid_recommendations(prod_id_int, products, orders)
                return jsonify(recs)
            except ValueError:
                pass
                
        if user_id:
            try:
                user_id_int = int(user_id)
                recs = get_personalized_recommendations(products, orders, user_id_int)
                return jsonify(recs)
            except ValueError:
                pass
    except Exception as e:
        app.logger.error(f"Error getting recommendations: {e}")
        
    # Default fallback: random 4 products
    random_recs = db_query("SELECT * FROM products ORDER BY RANDOM() LIMIT 4")
    return jsonify(random_recs)

@app.route("/apply_discount", methods=["POST"])
def apply_discount():
    data = request.json or {}
    total = float(data.get("total", 0))
    discount_code = data.get("code", "")
    
    discount_percent = 0
    if discount_code == "SPIN5":
        discount_percent = 5
    elif discount_code == "SPIN10":
        discount_percent = 10
    elif discount_code == "SPIN15":
        discount_percent = 15
        
    discount_amount = total * (discount_percent / 100.0)
    final_total = total - discount_amount
    
    return jsonify({
        "original": total,
        "discount": discount_amount,
        "final": final_total,
        "applied": discount_percent > 0
    })


# ----------------- ADMIN ENDPOINTS -----------------
@app.route("/admin/users", methods=["GET"])
@token_required
@role_required('admin')
def get_all_users(current_user):
    users = db_query("SELECT id, username, role, xp, points, badges, email, mobile, streak, last_active FROM users")
    for u in users:
        try:
            u['badges'] = json.loads(u['badges']) if u['badges'] else []
        except Exception:
            u['badges'] = []
    return jsonify(users)

@app.route("/admin/users/<int:user_id>/role", methods=["PUT"])
@token_required
@role_required('admin')
def update_user_role(current_user, user_id):
    new_role = request.json.get("role")
    db_query("UPDATE users SET role = ? WHERE id = ?", (new_role, user_id), commit=True)
    return jsonify({"message": "Updated"})

@app.route("/admin/users/<int:user_id>", methods=["DELETE"])
@token_required
@role_required('admin')
def delete_user(current_user, user_id):
    if current_user["id"] == user_id:
        return jsonify({"error": "You cannot delete your own admin account!"}), 400
    db_query("DELETE FROM users WHERE id = ?", (user_id,), commit=True)
    return jsonify({"message": "User deleted successfully"})

@app.route("/admin/orders/<int:order_id>", methods=["PUT"])
@token_required
@role_required('admin')
def update_order_status(current_user, order_id):
    data = request.json or {}
    status = data.get("status")
    if not status:
        return jsonify({"error": "Missing status"}), 400
    db_query("UPDATE orders SET status = ? WHERE id = ?", (status, order_id), commit=True)
    return jsonify({"message": "Order status updated successfully"})

@app.route("/admin/orders/<int:order_id>", methods=["DELETE"])
@token_required
@role_required('admin')
def delete_order(current_user, order_id):
    db_query("DELETE FROM orders WHERE id = ?", (order_id,), commit=True)
    return jsonify({"message": "Order deleted successfully"})


# Initialize the database immediately when app.py is loaded (works for both local and Gunicorn)
init_db()

# ----------------- PING / KEEP-ALIVE -----------------
@app.route("/ping", methods=["GET"])
def ping():
    """Lightweight keep-alive endpoint. Returns instantly without DB access."""
    return jsonify({"status": "ok", "message": "ShopSphere backend is awake 🟢"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)
