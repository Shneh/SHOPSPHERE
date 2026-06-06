import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Home({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  
  // Sort states
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const navigate = useNavigate();

  const categories = ['All', 'Electronics', 'Clothing', 'Grocery', 'Home & Furniture', 'Books & Education'];

  useEffect(() => {
    fetchProducts();
    fetchRecommendations();
  }, []);

  const fetchProducts = async (query = '', cat = 'All') => {
    setLoading(true);
    try {
      let url = `/products?search=${encodeURIComponent(query)}`;
      if (cat && cat !== 'All') {
        url += `&category=${encodeURIComponent(cat)}`;
      }
      const res = await axios.get(url);
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get('/recommend');
      setRecommendations(res.data);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(search, activeCategory);
  };

  const handleCategoryClick = (cat) => {
    if (cat === 'All') {
      setActiveCategory('All');
      fetchProducts(search, 'All');
    } else {
      // Navigate to the separate category page
      navigate(`/category/${encodeURIComponent(cat)}`);
    }
  };

  // Sort logic client side for instant reactivity
  const sortedProducts = [...products].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];
    
    if (sortBy === 'price') {
      valA = parseFloat(valA || 0);
      valB = parseFloat(valB || 0);
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    } else {
      valA = (valA || '').toString().toLowerCase();
      valB = (valB || '').toString().toLowerCase();
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
      
      {/* Hero Section */}
      <section className="glass-card" style={{ 
        textAlign: 'center', 
        padding: '4rem 2rem', 
        background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(236, 72, 153, 0.03) 50%, rgba(255, 255, 255, 0.8) 100%)',
        border: '1px solid var(--card-border)',
        marginTop: '1rem'
      }}>
        <h1 style={{ fontSize: '3.5rem', lineHeight: '1.15', marginBottom: '1rem', fontWeight: 800 }}>
          Discover the Future of <span className="text-gradient">Shopping</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto 2.5rem', lineHeight: '1.6' }}>
          Welcome to ShopSphere — where innovation meets convenience. Start exploring our premium collection and level up your shopper rewards!
        </p>
        
        <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input 
              type="text" 
              placeholder="Search products, brands, categories..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ marginBottom: 0, padding: '0.9rem 1.25rem', borderRadius: '30px' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0.9rem 2.2rem', borderRadius: '30px' }}>
              🔍 Search
            </button>
          </div>
          
          {/* Top Selects for Sorting */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Sort By:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ marginBottom: 0, padding: '0.4rem 1rem', width: '150px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1px solid rgba(15,23,42,0.1)' }}>
                <option value="name">Name</option>
                <option value="price">Price</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Order:</span>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ marginBottom: 0, padding: '0.4rem 1rem', width: '150px', borderRadius: '20px', backgroundColor: '#ffffff', border: '1px solid rgba(15,23,42,0.1)' }}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </form>
      </section>

      {/* Products Showcase */}
      <section>
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>🛍 Explore Catalog</h2>
          {/* Category Filters */}
          <div className="category-filter-container" style={{ marginBottom: 0 }}>
            {categories.map((cat) => (
              <span 
                key={cat} 
                className={`category-tag ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          // Skeletal Loading
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
            {sortedProducts.map(p => (
              <div key={p.id} className="glass-card glow-hover" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                <div className="product-image-container">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="product-image" />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      📷 No Image Available
                    </div>
                  )}
                  <span className="badge badge-primary" style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    {p.category}
                  </span>
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
            
            {sortedProducts.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</p>
                <h3>No products found</h3>
                <p>Try searching for other products or select different categories.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Recommendations Slider */}
      {recommendations.length > 0 && (
        <section>
          <h2 style={{ marginBottom: '1.5rem' }}>✨ Recommended for You</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
            {recommendations.map(p => (
              <div key={p.id} className="glass-card glow-hover" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.5)' }}>
                <div className="product-image-container" style={{ height: '150px' }}>
                  <img src={p.image} alt={p.name} className="product-image" />
                </div>
                <h4 style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.5rem' }}>{p.name}</h4>
                <div className="flex justify-between items-center">
                  <span className="price-tag" style={{ fontSize: '1.1rem' }}>₹{p.price}</span>
                  <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => onAddToCart(p)}>
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
