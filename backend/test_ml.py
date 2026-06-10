import unittest
import json
from ml_engine import (
    get_semantic_search_results,
    get_hybrid_recommendations,
    get_personalized_recommendations,
    generate_local_nlp_verdict
)

class TestMLEngine(unittest.TestCase):
    
    def setUp(self):
        # Sample products representing different categories
        self.products = [
            {"id": 1, "name": "Cyberpunk Headphones", "category": "Electronics", "price": 2999.0, "sizes": "unisized", "description": "High fidelity sound, active noise cancelling, blue color design."},
            {"id": 2, "name": "Classic Denim Jacket", "category": "Clothing", "price": 1499.0, "sizes": "S, M, L", "description": "Classic blue organic cotton denim material jacket."},
            {"id": 3, "name": "Drawing Sketchbook", "category": "Books & Education", "price": 299.0, "sizes": "unisized", "description": "Acid free white drawing papers sketchbook for art painting."},
            {"id": 4, "name": "Smart Watch Series 9", "category": "Electronics", "price": 4999.0, "sizes": "unisized", "description": "AMOLED touch display smart watch, heart rate monitor and steps tracker."},
            {"id": 5, "name": "Casual Cotton T-Shirt", "category": "Clothing", "price": 499.0, "sizes": "S, M, L", "description": "100% pure combed organic cotton classic crewneck white tee shirt."}
        ]
        
        # Sample orders for collaborative filtering
        # Order 1: items 1 and 4 bought together (Electronics combo)
        # Order 2: user 11 only bought item 2 (Clothing jacket)
        # Order 3: items 1 and 3 bought together
        # Order 4: user 12 bought both items 2 and 5 (enables collaborative filtering recommendations)
        self.orders = [
            {"id": 101, "user_id": 10, "cart": [{"id": 1}, {"id": 4}]},
            {"id": 102, "user_id": 11, "cart": [{"id": 2}]},
            {"id": 103, "user_id": 10, "cart": [{"id": 1}, {"id": 3}]},
            {"id": 104, "user_id": 12, "cart": [{"id": 2}, {"id": 5}]}
        ]

    def test_semantic_search_headphones(self):
        # A search query for "sound" should rank Cyberpunk Headphones first
        results = get_semantic_search_results("sound active", self.products)
        self.assertTrue(len(results) > 0)
        self.assertEqual(results[0]["id"], 1) # Headphones
        
    def test_semantic_search_denim(self):
        # A search for "cotton jacket" should rank Denim Jacket high
        results = get_semantic_search_results("cotton jacket", self.products)
        self.assertTrue(len(results) > 0)
        self.assertEqual(results[0]["id"], 2) # Denim Jacket

    def test_hybrid_recommendation_electronics(self):
        # Recommendations for Headphones (id 1)
        # Since Order 1 has 1 and 4 together, and id 4 is also Electronics, it should be the top recommendation
        recs = get_hybrid_recommendations(1, self.products, self.orders, top_n=2)
        self.assertTrue(len(recs) > 0)
        self.assertEqual(recs[0]["id"], 4) # Smart Watch Series 9

    def test_personalized_recommendations(self):
        # User 11 bought Denim Jacket (id 2)
        # They should get recommended Casual Cotton T-Shirt (id 5) because they were ordered together in order 102
        recs = get_personalized_recommendations(self.products, self.orders, 11, top_n=1)
        self.assertTrue(len(recs) > 0)
        self.assertEqual(recs[0]["id"], 5) # Cotton T-Shirt

    def test_ai_verdict_generator(self):
        # Verify local verdict generation generates reasonable outputs
        verdict = generate_local_nlp_verdict(self.products[0])
        self.assertIn("AI Match Quality", verdict)
        self.assertIn("Headphones", verdict)

if __name__ == '__main__':
    unittest.main()
