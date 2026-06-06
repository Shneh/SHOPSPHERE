import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function CategoryPage({ onAddToCart }) {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [categoryName]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/products?category=${encodeURIComponent(categoryName)}`);
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch category products:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Category Header */}
      <div className="glass-card" style={{ 
        padding: '2rem', 
        background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.05) 0%, rgba(255, 255, 255, 0.8) 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <Link to="/" style={{ color: 'var(--primary-color)', fontWeight: '600', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
            ← Back to Home
          </Link>
          <h2 style={{ fontSize: '2.2rem' }}>{categoryName} Catalog</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Explore our curated collection of {categoryName.toLowerCase()} products.</p>
        </div>
        
        <span className="badge badge-primary" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
          🏷️ {products.length} Items
        </span>
      </div>

      {loading ? (
        <div className="product-grid">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="glass-card" style={{ padding: '1rem', height: '360px' }}>
              <div style={{ width: '100%', height: '200px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', animation: 'fadeIn 1s infinite alternate' }}></div>
              <div style={{ height: '20px', background: 'rgba(0,0,0,0.03)', borderRadius: '4px', marginTop: '1rem', width: '70%' }}></div>
              <div style={{ height: '15px', background: 'rgba(0,0,0,0.03)', borderRadius: '4px', marginTop: '0.5rem', width: '40%' }}></div>
              <div style={{ height: '40px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', marginTop: '1.5rem' }}></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="product-grid">
          {products.map(p => (
            <div key={p.id} className="glass-card glow-hover" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
              <div className="product-image-container">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="product-image" />
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    📷 No Image
                  </div>
                )}
              </div>
              
              <h3 style={{ fontSize: '1.2rem', margin: '0.5rem 0 0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.name}
              </h3>
              
              <div className="flex justify-between items-center" style={{ marginTop: 'auto' }}>
                <p className="price-tag">₹{p.price}</p>
                <span style={{ fontSize: '0.8rem', color: p.stock > 0 ? 'var(--accent-color)' : 'var(--error-color)', fontWeight: '600' }}>
                  {p.stock > 0 ? `In Stock: ${p.stock}` : 'Out of Stock'}
                </span>
              </div>

              <button 
                className="btn-primary mt-4" 
                style={{ width: '100%' }} 
                disabled={p.stock <= 0}
                onClick={() => onAddToCart(p)}
              >
                🛒 Add to Cart
              </button>
            </div>
          ))}

          {products.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛍️</p>
              <h3>No products found in this category</h3>
              <p>Check back later or explore other sections.</p>
              <Link to="/" className="btn-primary mt-4">Return to Home</Link>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
