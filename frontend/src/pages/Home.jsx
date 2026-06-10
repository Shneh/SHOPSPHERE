import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Home({ onAddToCart }) {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Live search autocomplete states
  const [liveResults, setLiveResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const searchContainerRef = useRef(null);
  const debounceTimer = useRef(null);
  
  // Sort states
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const navigate = useNavigate();

  const categories = ['All', 'Electronics', 'Clothing', 'Grocery', 'Home & Furniture', 'Books & Education'];

  useEffect(() => {
    // Serve cached products instantly, then revalidate in background
    const cached = loadFromCache();
    if (cached && cached.length > 0) {
      setProducts(cached);
      setLoading(false);
      // Silently refresh in background
      fetchProducts();
    } else {
      fetchProducts();
    }
    fetchRecommendations();
  }, [user]);

  const CACHE_KEY = 'ss_products_cache';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Stale-while-revalidate: load from cache instantly
  const loadFromCache = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL) return data;
    } catch (e) {}
    return null;
  };

  const saveToCache = (data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch (e) {}
  };

  const fetchProducts = async (query = '', cat = 'All') => {
    // Only show spinner if there is no cached data already displayed
    if (products.length === 0) setLoading(true);
    try {
      let url = `/products?search=${encodeURIComponent(query)}`;
      if (cat && cat !== 'All') url += `&category=${encodeURIComponent(cat)}`;
      const res = await axios.get(url);
      setProducts(res.data);
      // Only cache the default (no query / no category filter) result
      if (!query && (!cat || cat === 'All')) saveToCache(res.data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      let url = '/recommend';
      if (user && user.id) {
        url += `?user_id=${user.id}`;
      }
      const res = await axios.get(url);
      setRecommendations(res.data);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  };

  // Debounced live search as user types
  const fetchLiveResults = useCallback((query) => {
    if (!query || query.trim().length < 2) {
      setLiveResults([]);
      setShowDropdown(false);
      return;
    }
    setLiveLoading(true);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await axios.get(`/products?search=${encodeURIComponent(query)}`);
        setLiveResults(res.data.slice(0, 6));
        setShowDropdown(true);
      } catch (err) {
        setLiveResults([]);
      } finally {
        setLiveLoading(false);
      }
    }, 280);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchLiveResults(val);
  };

  const handleSelectSuggestion = (product) => {
    setShowDropdown(false);
    setSearch('');
    navigate(`/product/${product.id}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    fetchProducts(search, activeCategory);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
          <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }} ref={searchContainerRef}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                id="home-search-input"
                placeholder="Search products, brands, categories..."
                value={search}
                onChange={handleSearchChange}
                onFocus={() => search.trim().length >= 2 && setShowDropdown(true)}
                onKeyDown={(e) => e.key === 'Escape' && setShowDropdown(false)}
                style={{ marginBottom: 0, padding: '0.9rem 1.25rem', borderRadius: '30px', width: '100%' }}
                autoComplete="off"
              />

              {/* Live Search Dropdown */}
              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  background: 'rgba(255,255,255,0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(13,148,136,0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                  zIndex: 1000,
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease'
                }}>
                  {liveLoading ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      ⏳ Searching...
                    </div>
                  ) : liveResults.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No results found for "{search}"
                    </div>
                  ) : (
                    <>
                      <div style={{ padding: '0.6rem 1rem 0.25rem', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        🔍 {liveResults.length} Result{liveResults.length !== 1 ? 's' : ''}
                      </div>
                      {liveResults.map((product, idx) => (
                        <div
                          key={product.id}
                          onClick={() => handleSelectSuggestion(product)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.65rem 1rem',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                            borderTop: idx === 0 ? 'none' : '1px solid rgba(0,0,0,0.04)'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,148,136,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{ width: '44px', height: '44px', background: 'rgba(13,148,136,0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: '600', fontSize: '0.9rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>{product.category}</p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--primary-color)' }}>₹{product.price}</span>
                            {product.cost_price && product.cost_price > product.price && (
                              <p style={{ fontSize: '0.7rem', color: 'var(--accent-color)', margin: '0.1rem 0 0', fontWeight: '600' }}>
                                {Math.round(((product.cost_price - product.price) / product.cost_price) * 100)}% OFF
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      <div
                        onClick={() => { setShowDropdown(false); fetchProducts(search, activeCategory); }}
                        style={{
                          padding: '0.65rem 1rem',
                          textAlign: 'center',
                          fontSize: '0.8rem',
                          color: 'var(--primary-color)',
                          fontWeight: '700',
                          cursor: 'pointer',
                          borderTop: '1px solid rgba(13,148,136,0.1)',
                          background: 'rgba(13,148,136,0.02)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,148,136,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(13,148,136,0.02)'}
                      >
                        See all results for "{search}" →
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '0.9rem 2.2rem', borderRadius: '30px', flexShrink: 0 }}>
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
                <div 
                  className="product-image-container" 
                  onClick={() => navigate(`/product/${p.id}`)}
                  style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', borderRadius: '10px', marginBottom: '1rem', height: '200px', background: '#f1f5f9' }}
                >
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
                
                <h3 
                  onClick={() => navigate(`/product/${p.id}`)}
                  style={{ fontSize: '1.2rem', margin: '0.5rem 0 0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                >
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
                <div 
                  className="product-image-container" 
                  onClick={() => navigate(`/product/${p.id}`)}
                  style={{ height: '150px', cursor: 'pointer', position: 'relative', overflow: 'hidden', borderRadius: '10px', marginBottom: '1rem', background: '#f1f5f9' }}
                >
                  <img src={p.image} alt={p.name} className="product-image" />
                </div>
                <h4 
                  onClick={() => navigate(`/product/${p.id}`)}
                  style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.5rem', cursor: 'pointer' }}
                >
                  {p.name}
                </h4>
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
