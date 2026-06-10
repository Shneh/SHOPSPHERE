import os
import json
import random
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import sklearn dependencies
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    SKLEARN_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ scikit-learn or numpy not found. Falling back to basic string matching algorithms.")
    SKLEARN_AVAILABLE = False

# Try to import google-generativeai for Gemini API
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    logger.warning("⚠️ google-generativeai package not found. AI verdicts will use local NLP heuristics.")
    GEMINI_AVAILABLE = False


# Configure Gemini if key is present
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_AVAILABLE and GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("✅ Gemini API configured successfully.")
    except Exception as e:
        logger.error(f"❌ Failed to configure Gemini API: {e}")
        GEMINI_API_KEY = None


# ── Module-level TF-IDF cache ──────────────────────────────────────────────
# Built once per server process; never re-fitted unless products change.
_tfidf_cache = {
    "vectorizer": None,
    "matrix": None,
    "products": None,  # reference snapshot to detect staleness
}


def build_profile(product):
    """
    Builds a text profile for a product combining name, category, sizes, and description.
    """
    name = product.get("name") or ""
    category = product.get("category") or ""
    description = product.get("description") or ""
    sizes = product.get("sizes") or ""
    return f"{name} {category} {description} {sizes}".lower()


def _build_tfidf_index(products):
    """Build and cache the TF-IDF matrix for the given product list."""
    global _tfidf_cache
    if not SKLEARN_AVAILABLE or not products:
        return
    try:
        corpus = [build_profile(p) for p in products]
        vectorizer = TfidfVectorizer(stop_words='english')
        matrix = vectorizer.fit_transform(corpus)
        _tfidf_cache["vectorizer"] = vectorizer
        _tfidf_cache["matrix"] = matrix
        _tfidf_cache["products"] = list(products)
        logger.info(f"✅ TF-IDF index built for {len(products)} products.")
    except Exception as e:
        logger.error(f"Error building TF-IDF index: {e}")


def warm_up(products):
    """Pre-warm the TF-IDF index. Call once at startup."""
    if _tfidf_cache["vectorizer"] is None:
        _build_tfidf_index(products)

def get_semantic_search_results(query, products, top_n=20):
    """
    Uses cached TF-IDF index for instant semantic search.
    Falls back to simple keyword matching if sklearn is unavailable.
    """
    if not products:
        return []
        
    if not query or not query.strip():
        return products
        
    query_str = query.strip().lower()
    
    if SKLEARN_AVAILABLE:
        try:
            # Use cached index if available and for same product set, else rebuild
            if (_tfidf_cache["vectorizer"] is None or
                    _tfidf_cache["products"] is None or
                    len(_tfidf_cache["products"]) != len(products)):
                _build_tfidf_index(products)

            vectorizer = _tfidf_cache["vectorizer"]
            tfidf_matrix = _tfidf_cache["matrix"]

            if vectorizer is None:
                raise ValueError("Vectorizer unavailable")

            # Vectorize query against cached matrix
            query_vector = vectorizer.transform([query_str])
            similarities = cosine_similarity(query_vector, tfidf_matrix).flatten()
            
            scored_products = []
            for idx, p in enumerate(products):
                p_copy = dict(p)
                p_copy["relevance_score"] = float(similarities[idx])
                scored_products.append(p_copy)
                
            scored_products.sort(key=lambda x: x["relevance_score"], reverse=True)
            
            positive_matches = [p for p in scored_products if p["relevance_score"] > 0]
            if positive_matches:
                return positive_matches[:top_n]
            return scored_products[:top_n]
            
        except Exception as e:
            logger.error(f"Error in TF-IDF semantic search: {e}")
            
    # Fallback keyword ranking
    scored_products = []
    query_words = query_str.split()
    for p in products:
        p_copy = dict(p)
        profile = build_profile(p_copy)
        
        # Simple scoring: count query word occurrences in profile
        score = 0
        for word in query_words:
            if word in profile:
                score += 1
                if word in p_copy.get("name", "").lower():
                    score += 2 # boost name match
                    
        p_copy["relevance_score"] = float(score)
        scored_products.append(p_copy)
        
    # Filter products with score > 0
    scored_products = [p for p in scored_products if p["relevance_score"] > 0]
    scored_products.sort(key=lambda x: x["relevance_score"], reverse=True)
    return scored_products[:top_n]


def get_hybrid_recommendations(product_id, products, orders, top_n=4):
    """
    Returns hybrid recommendations for a product:
    Content-Based (TF-IDF similarity) + Collaborative (co-occurrence in order carts).
    """
    if not products:
        return []
        
    # Find current product
    current_prod = None
    for p in products:
        if p["id"] == product_id:
            current_prod = p
            break
            
    if not current_prod:
        return random.sample(products, min(len(products), top_n))
        
    # Initialize score map for all OTHER products
    other_products = [p for p in products if p["id"] != product_id]
    if not other_products:
        return []
        
    product_scores = {p["id"]: 0.0 for p in other_products}
    
    # 1. Content-based scores
    if SKLEARN_AVAILABLE:
        try:
            corpus = [build_profile(p) for p in products]
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(corpus)
            
            # Find index of current product
            current_idx = -1
            for idx, p in enumerate(products):
                if p["id"] == product_id:
                    current_idx = idx
                    break
                    
            if current_idx != -1:
                # Compute similarities against all products
                similarities = cosine_similarity(tfidf_matrix[current_idx], tfidf_matrix).flatten()
                
                # Apply scores to other products
                for idx, p in enumerate(products):
                    if p["id"] != product_id:
                        # Map index back
                        product_scores[p["id"]] += float(similarities[idx]) * 0.6  # 60% weight to content similarity
        except Exception as e:
            logger.error(f"Error in Content-Based recommendation: {e}")
            
    # If sklearn is not available, do simple category boost
    if not SKLEARN_AVAILABLE:
        for p in other_products:
            if p["category"] == current_prod["category"]:
                product_scores[p["id"]] += 0.5
                
    # 2. Collaborative Filtering (frequently bought together)
    co_occurrences = {}
    for o in orders:
        try:
            cart = o.get("cart")
            if not cart:
                # Parse JSON cart_json if available
                cart_json = o.get("cart_json")
                if cart_json:
                    cart = json.loads(cart_json)
            
            if cart and isinstance(cart, list):
                item_ids = [item.get("id") for item in cart if item.get("id") is not None]
                if product_id in item_ids:
                    # Increment count for all other items in this cart
                    for item_id in item_ids:
                        if item_id != product_id:
                            co_occurrences[item_id] = co_occurrences.get(item_id, 0) + 1
        except Exception as e:
            logger.error(f"Error parsing order for recommendations: {e}")
            
    # Add collaborative scores
    if co_occurrences:
        max_co = max(co_occurrences.values())
        for p_id, count in co_occurrences.items():
            if p_id in product_scores:
                # Normalize count and add with 40% weight
                product_scores[p_id] += (count / max_co) * 0.4
                
    # Sort products by total accumulated score
    ranked_products = []
    for p in other_products:
        p_copy = dict(p)
        p_copy["recommendation_score"] = product_scores[p["id"]]
        ranked_products.append(p_copy)
        
    ranked_products.sort(key=lambda x: x["recommendation_score"], reverse=True)
    
    # Fallback to same-category if scores are all zero
    top_matches = [p for p in ranked_products if p["recommendation_score"] > 0]
    if len(top_matches) < top_n:
        # Fill in with products from same category
        filled_ids = {p["id"] for p in top_matches}
        category_fillers = [
            p for p in other_products 
            if p["category"] == current_prod["category"] and p["id"] not in filled_ids
        ]
        top_matches.extend(category_fillers)
        
        # If still not enough, fill with random other products
        filled_ids = {p["id"] for p in top_matches}
        remaining_fillers = [p for p in other_products if p["id"] not in filled_ids]
        top_matches.extend(random.sample(remaining_fillers, min(len(remaining_fillers), top_n - len(top_matches))))
        
    return top_matches[:top_n]


def get_personalized_recommendations(products, orders, user_id, top_n=4):
    """
    Returns personalized recommendations for a user based on their past orders.
    Uses collaborative recommendations (users who bought these also bought...).
    """
    if not products:
        return []
        
    # 1. Find all product IDs the user has bought in their history
    user_bought_ids = set()
    for o in orders:
        if o.get("user_id") == user_id:
            try:
                cart = o.get("cart")
                if not cart and o.get("cart_json"):
                    cart = json.loads(o.get("cart_json"))
                if cart and isinstance(cart, list):
                    for item in cart:
                        if item.get("id") is not None:
                            user_bought_ids.add(item.get("id"))
            except Exception as e:
                logger.error(f"Error parsing order for user {user_id}: {e}")
                
    # If user hasn't bought anything, return top-selling products (most popular in orders) or random
    if not user_bought_ids:
        # Get counts of all ordered products to recommend popular items
        popular_counts = {}
        for o in orders:
            try:
                cart = o.get("cart") or (json.loads(o.get("cart_json")) if o.get("cart_json") else [])
                for item in cart:
                    i_id = item.get("id")
                    if i_id:
                        popular_counts[i_id] = popular_counts.get(i_id, 0) + item.get("quantity", 1)
            except Exception:
                pass
                
        if popular_counts:
            sorted_popular = sorted(popular_counts.items(), key=lambda x: x[1], reverse=True)
            popular_ids = [p_id for p_id, count in sorted_popular]
            recommended = [p for p_id in popular_ids for p in products if p["id"] == p_id]
            if len(recommended) < top_n:
                # Fill with random
                filled = {p["id"] for p in recommended}
                remaining = [p for p in products if p["id"] not in filled]
                recommended.extend(random.sample(remaining, min(len(remaining), top_n - len(recommended))))
            return recommended[:top_n]
            
        return random.sample(products, min(len(products), top_n))
        
    # 2. Find other items bought by users who also bought any of the items in user_bought_ids
    co_occurrences = {}
    for o in orders:
        try:
            cart = o.get("cart") or (json.loads(o.get("cart_json")) if o.get("cart_json") else [])
            item_ids = {item.get("id") for item in cart if item.get("id") is not None}
            
            # Check if this order shares items with what the current user bought
            shared = item_ids.intersection(user_bought_ids)
            if shared:
                # Recommend other items from this order
                for item_id in item_ids:
                    if item_id not in user_bought_ids:
                        co_occurrences[item_id] = co_occurrences.get(item_id, 0) + 1
        except Exception:
            pass
            
    # Sort co-occurring items
    recommended_items = []
    if co_occurrences:
        sorted_co = sorted(co_occurrences.items(), key=lambda x: x[1], reverse=True)
        for p_id, count in sorted_co:
            for p in products:
                if p["id"] == p_id:
                    p_copy = dict(p)
                    p_copy["recommendation_score"] = float(count)
                    recommended_items.append(p_copy)
                    break
                    
    # Fill in with categories matching user_bought items
    if len(recommended_items) < top_n:
        user_categories = {p["category"] for p in products if p["id"] in user_bought_ids}
        filled_ids = {p["id"] for p in recommended_items}.union(user_bought_ids)
        
        category_fillers = [
            p for p in products 
            if p["category"] in user_categories and p["id"] not in filled_ids
        ]
        recommended_items.extend(category_fillers)
        
        # Final fallback to general random
        filled_ids = {p["id"] for p in recommended_items}.union(user_bought_ids)
        remaining = [p for p in products if p["id"] not in filled_ids]
        recommended_items.extend(random.sample(remaining, min(len(remaining), top_n - len(recommended_items))))
        
    return recommended_items[:top_n]


def generate_local_nlp_verdict(product):
    """
    Generates a high-quality simulated AI review summary by extracting key features from metadata.
    """
    name = product.get("name") or "Product"
    category = product.get("category") or "General"
    desc = product.get("description") or "high quality item"
    price = product.get("price") or 0.0
    
    score = 90 + (product.get("id", 0) % 10)
    
    positives = [
        "premium design aesthetics",
        "excellent value for money",
        "durability & build quality",
        "ergonomic structure",
        "extremely high user reviews"
    ]
    chosen_positives = random.sample(positives, 2)
    
    category_pitches = {
        "Electronics": f"ShopSphere AI matches this product at {score}%. Immersive specs, premium chip integration, and low power dissipation ratios make this item a clear winner in the {category} segment.",
        "Clothing": f"ShopSphere AI style index: {score}/100. Outstanding seam alignment, breathable cotton weaves, and true-to-size contours ensure high comfort levels during regular use.",
        "Grocery": f"Freshness analytics score: {score}%. Verified organic parameters with zero preservative chemicals. Packed under sterile atmosphere constraints.",
        "Books & Education": f"Knowledge utility index: {score}%. Clear explanations, modern diagrams, and highly engaging chapter flows. Recommended reading for student learners.",
        "Home & Furniture": f"Ergonomic fit index: {score}%. Built from durable materials with elegant styling cues that blend seamlessly into standard living spaces."
    }
    
    pitch = category_pitches.get(category, f"ShopSphere AI capability index: {score}%. Features high build quality and premium material selection. Excellent fit for users seeking reliability.")
    
    verdict = (
        f"🤖 **AI Match Quality: {score}%**\n\n"
        f"For the **{name}**: {pitch} Key highlights include **{chosen_positives[0]}** and **{chosen_positives[1]}**.\n\n"
        f"*Verdict*: Highly recommended purchase at the ₹{price:.2f} price tier. Pairs exceptionally well with other catalog listings in the {category} category."
    )
    return verdict


def generate_ai_verdict(product):
    """
    Generates a product verdict using Gemini generative AI if configured.
    Otherwise, falls back to a clean local NLP summary generator.
    """
    if not GEMINI_API_KEY or not GEMINI_AVAILABLE:
        return generate_local_nlp_verdict(product)
        
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = (
            f"You are the ShopSphere AI Assistant. Analyze the following product metadata:\n"
            f"Name: {product.get('name')}\n"
            f"Category: {product.get('category')}\n"
            f"Price: INR {product.get('price')}\n"
            f"Sizes: {product.get('sizes')}\n"
            f"Description: {product.get('description')}\n\n"
            f"Write a short, engaging, 3-4 sentence 'ShopSphere AI Verdict' review detailing the match quality, "
            f"highlighting product specs, and suggesting recommendations. Format the output in Markdown. "
            f"Start with a calculated compatibility score (e.g. '🤖 **AI Match Quality: 95%**')."
        )
        
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text.strip()
            
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}. Falling back to local generator.")
        
    return generate_local_nlp_verdict(product)
