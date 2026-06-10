import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Search, SlidersHorizontal, TrendingUp, ShoppingCart, ArrowRight, Package } from 'lucide-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      
      {/* ── Hero ────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(160deg, #ffffff 0%, #f5f5f7 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'clamp(2.5rem, 6vw, 4.5rem) clamp(1.5rem, 5vw, 4rem)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Soft background orb */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '340px', height: '340px',
          background: 'radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '20%',
          width: '280px', height: '280px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <p className="section-eyebrow">Powered by AI recommendations</p>
          <h1 style={{ marginBottom: '1.1rem' }}>
            The smarter way to <span className="text-gradient">shop</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '540px', margin: '0 auto 2.5rem', lineHeight: '1.65' }}>
            Discover millions of products with AI-powered search and personalised recommendations.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ maxWidth: '560px', margin: '0 auto 1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem', position: 'relative' }} ref={searchContainerRef}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  id="home-search-input"
                  placeholder="Search products, brands…"
                  value={search}
                  onChange={handleSearchChange}
                  onFocus={() => search.trim().length >= 2 && setShowDropdown(true)}
                  onKeyDown={e => e.key === 'Escape' && setShowDropdown(false)}
                  style={{ marginBottom: 0, paddingLeft: '2.6rem', paddingRight: '1rem', borderRadius: '12px', height: '48px', fontSize: '0.92rem', boxShadow: 'var(--shadow-sm)' }}
                  autoComplete="off"
                />

                {/* Live Search Dropdown */}
                {showDropdown && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                    background: '#ffffff', border: '1px solid var(--border)',
                    borderRadius: '14px', boxShadow: 'var(--shadow-xl)',
                    zIndex: 1000, overflow: 'hidden', animation: 'scaleIn 0.14s var(--ease-spring)'
                  }}>
                    {liveLoading ? (
                      <div style={{ padding: '1rem 1.2rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Searching…</div>
                    ) : liveResults.length === 0 ? (
                      <div style={{ padding: '1rem 1.2rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No results for "{search}"</div>
                    ) : (
                      <>
                        <div style={{ padding: '0.6rem 1.1rem 0.2rem', fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {liveResults.length} result{liveResults.length !== 1 ? 's' : ''}
                        </div>
                        {liveResults.map((product, idx) => (
                          <div key={product.id} onClick={() => handleSelectSuggestion(product)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', cursor: 'pointer', transition: 'background 0.12s', borderTop: idx === 0 ? 'none' : '1px solid var(--border-subtle)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.04)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            {product.image
                              ? <img src={product.image} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                              : <div style={{ width: '40px', height: '40px', background: 'var(--bg)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={16} color="var(--text-tertiary)" /></div>
                            }
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: '600', fontSize: '0.88rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '0.1rem 0 0' }}>{product.category}</p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <span style={{ fontWeight: '700', fontSize: '0.88rem' }}>₹{product.price}</span>
                              {product.cost_price && product.cost_price > product.price && (
                                <p style={{ fontSize: '0.68rem', color: 'var(--emerald)', margin: '0.1rem 0 0', fontWeight: '700' }}>
                                  {Math.round(((product.cost_price - product.price) / product.cost_price) * 100)}% off
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        <div onClick={() => { setShowDropdown(false); fetchProducts(search, activeCategory); }}
                          style={{ padding: '0.7rem 1rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--indigo)', fontWeight: '700', cursor: 'pointer', borderTop: '1px solid var(--border-subtle)', background: 'rgba(79,70,229,0.02)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(79,70,229,0.02)'}
                        >
                          View all results for "{search}" <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary" style={{ height: '48px', padding: '0 1.5rem', borderRadius: '12px', flexShrink: 0, gap: '0.4rem' }}>
                <Search size={15} /> Search
              </button>
            </div>
          </form>

          {/* Sort controls */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={13} color="var(--text-tertiary)" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ marginBottom: 0, padding: '0.35rem 0.85rem', width: 'auto', borderRadius: '8px', fontSize: '0.82rem', background: 'white', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="name">Name</option>
                <option value="price">Price</option>
              </select>
              <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ marginBottom: 0, padding: '0.35rem 0.85rem', width: 'auto', borderRadius: '8px', fontSize: '0.82rem', background: 'white', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="asc">Low to High</option>
                <option value="desc">High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── Products ─────────────────────────────────────── */}
      <section>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p className="section-eyebrow">Catalogue</p>
            <h2 style={{ marginTop: 0 }}>Explore products</h2>
          </div>
          {/* Category Filters */}
          <div className="category-filter-container" style={{ marginBottom: 0 }}>
            {categories.map(cat => (
              <span key={cat} className={`category-tag ${activeCategory === cat ? 'active' : ''}`} onClick={() => handleCategoryClick(cat)}>
                {cat}
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          // Shimmer skeletons
          <div className="product-grid">
            {[1,2,3,4,5,6].map(n => (
              <div key={n} style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--bg-alt)', border: '1px solid var(--border-subtle)' }}>
                <div className="skeleton" style={{ aspectRatio: '1/1', width: '100%', borderRadius: 0 }} />
                <div style={{ padding: '1.1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div className="skeleton" style={{ height: '14px', width: '70%' }} />
                  <div className="skeleton" style={{ height: '12px', width: '40%' }} />
                  <div className="skeleton" style={{ height: '38px', width: '100%', marginTop: '0.5rem', borderRadius: '10px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="product-grid">
            {sortedProducts.map(p => {
              const discount = p.cost_price && p.cost_price > p.price
                ? Math.round(((p.cost_price - p.price) / p.cost_price) * 100)
                : 0;
              return (
                <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
                  <div className="product-img-wrap">
                    {p.image
                      ? <img src={p.image} alt={p.name} loading="lazy" />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={36} color="var(--text-tertiary)" /></div>
                    }
                    {/* Badges overlay */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-neutral" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)' }}>{p.category}</span>
                      {discount > 0 && <span className="badge badge-accent" style={{ background: 'rgba(5,150,105,0.9)', color: 'white', border: 'none' }}>{discount}% off</span>}
                    </div>
                    {/* Out of stock overlay */}
                    {p.stock <= 0 && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.82rem', color: 'var(--rose)', background: 'white', padding: '0.35rem 0.75rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>Out of Stock</span>
                      </div>
                    )}
                  </div>

                  <div className="product-card-body">
                    <p className="product-name">{p.name}</p>
                    <div className="product-price-row">
                      <span className="product-price">₹{p.price}</span>
                      {p.cost_price && p.cost_price > p.price && (
                        <span className="product-price-original">₹{p.cost_price}</span>
                      )}
                    </div>
                    <button
                      className="btn-primary w-full"
                      style={{ marginTop: '0.75rem', borderRadius: '10px', height: '40px', fontSize: '0.85rem', gap: '0.4rem' }}
                      disabled={p.stock <= 0}
                      onClick={e => { e.stopPropagation(); onAddToCart(p); }}
                    >
                      <ShoppingCart size={14} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}

            {sortedProducts.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
                <Package size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ marginBottom: '0.5rem' }}>No products found</h3>
                <p style={{ fontSize: '0.9rem' }}>Try different keywords or browse by category.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Recommendations ─────────────────────────────── */}
      {recommendations.length > 0 && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <TrendingUp size={18} color="var(--indigo)" />
            <div>
              <p className="section-eyebrow" style={{ marginBottom: '0.1rem' }}>AI-Powered</p>
              <h2 style={{ marginTop: 0 }}>Recommended for you</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {recommendations.map(p => (
              <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer' }}>
                <div className="product-img-wrap" style={{ aspectRatio: '4/3' }}>
                  {p.image
                    ? <img src={p.image} alt={p.name} loading="lazy" />
                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Package size={28} color="var(--text-tertiary)" /></div>
                  }
                </div>
                <div className="product-card-body" style={{ padding: '0.9rem 1rem 1rem' }}>
                  <p className="product-name" style={{ fontSize: '0.85rem' }}>{p.name}</p>
                  <div className="product-price-row">
                    <span className="product-price" style={{ fontSize: '1rem' }}>₹{p.price}</span>
                  </div>
                  <button className="btn-secondary btn-sm w-full" style={{ marginTop: '0.6rem', borderRadius: '8px', fontSize: '0.8rem' }}
                    onClick={e => { e.stopPropagation(); onAddToCart(p); }}>
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
