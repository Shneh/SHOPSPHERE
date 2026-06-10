import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function ProductDetail({ onAddToCart }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [aiVerdict, setAiVerdict] = useState('Generating AI Verdict...');
  
  const [selectedSize, setSelectedSize] = useState('unisized');
  const [quantity, setQuantity] = useState(1);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  
  // Review form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetails();
    setActiveMediaIndex(0);
  }, [productId]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const [prodRes, reviewsRes, recsRes, verdictRes] = await Promise.all([
        axios.get(`/products/${productId}`),
        axios.get(`/products/${productId}/reviews`),
        axios.get(`/recommend?product_id=${productId}`),
        axios.get(`/products/${productId}/ai-verdict`)
      ]);
      setProduct(prodRes.data);
      setReviews(reviewsRes.data);
      setRecommendations(recsRes.data);
      setAiVerdict(verdictRes.data.verdict);
      
      // Select first size option if available
      if (prodRes.data.sizes && prodRes.data.sizes !== 'unisized') {
        const firstSize = prodRes.data.sizes.split(',')[0].trim();
        setSelectedSize(firstSize);
      } else {
        setSelectedSize('unisized');
      }
    } catch (err) {
      console.error('Failed to load product details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!newComment.trim()) {
      setReviewError('Review comment cannot be empty.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setReviewError('Please login to post a review.');
        return;
      }
      await axios.post(`/products/${productId}/reviews`, {
        rating: newRating,
        comment: newComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviewSuccess('Review posted successfully! Thank you. ⭐');
      setNewComment('');
      setNewRating(5);
      
      // Refresh reviews list
      const res = await axios.get(`/products/${productId}/reviews`);
      setReviews(res.data);
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Failed to submit review.');
    }
  };

  const handleAddToCartClick = () => {
    if (!product) return;
    onAddToCart({
      ...product,
      quantity: quantity,
      selectedSize: selectedSize
    });
    alert(`🛒 Added ${quantity} x ${product.name} (${selectedSize}) to your cart!`);
  };

  const handleOrderNowClick = () => {
    if (!product) return;
    onAddToCart({
      ...product,
      quantity: quantity,
      selectedSize: selectedSize
    });
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '6rem' }}>
        <h3 style={{ animation: 'fadeIn 1s infinite alternate' }}>Loading product details...</h3>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="glass-card text-center" style={{ marginTop: '4rem', padding: '3rem' }}>
        <h2>⚠️ Product Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>The requested product does not exist or has been removed.</p>
        <Link to="/" className="btn-primary mt-4">Return to Storefront</Link>
      </div>
    );
  }

  // Cost and selling price math
  const cost = product.cost_price || product.price * 1.25;
  const selling = product.price;
  const discountPercent = Math.round(((cost - selling) / cost) * 100);
  
  // Available size options parsing
  const sizesList = product.sizes && product.sizes !== 'unisized' 
    ? product.sizes.split(',').map(s => s.trim()) 
    : [];

  const getMediaType = (url) => {
    if (!url) return 'image';
    const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase();
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    if (videoExtensions.some(ext => cleanUrl.endsWith(ext))) {
      return 'video';
    }
    if (url.includes('/video/upload/')) {
      return 'video';
    }
    return 'image';
  };

  let gallery = [];
  if (product.media_gallery) {
    try {
      gallery = typeof product.media_gallery === 'string' ? JSON.parse(product.media_gallery) : product.media_gallery;
    } catch (err) {
      console.error('Failed to parse media gallery:', err);
    }
  }
  if (!Array.isArray(gallery) || gallery.length === 0) {
    gallery = product.image ? [product.image] : [];
  }

  // Dynamic AI recommendation generation mock content
  const getAiRecommendationPitch = (p) => {
    const score = 94 + (p.id % 6);
    if (p.category === 'Electronics') {
      return `Based on your telemetry, ShopSphere AI rates this item a ${score}% match. Immersive specs, premium build grade, and high reviews make this item an excellent choice for modern users. Recommend matching with a standard hard-shell carrying case.`;
    } else if (p.category === 'Clothing') {
      return `This is a ${score}% match for your style profile. Combed material structure provides maximum fit and breathability. ShopSphere AI recommendation: True-to-size ordering. Best paired with clean high-top sneakers.`;
    } else if (p.category === 'Grocery') {
      return `AI freshness indicator: 99/100. Handpicked within the last 24 hours. Excellent nutritional rating. Highly compatible with light dressings and seasonal preparations.`;
    } else {
      return `This product scores a ${score}% compatibility index. Verified premium materials ensure high longevity and utility. ShopSphere AI highly recommends adding this to your collection.`;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', marginTop: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Back button */}
      <div>
        <Link to="/" style={{ color: 'var(--primary-color)', fontWeight: '600', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          ← Back to Marketplace Catalog
        </Link>
      </div>

      {/* Main product pane */}
      <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Product image block (Gallery format) */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', background: '#ffffff', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
            {gallery.length > 0 ? (
              getMediaType(gallery[activeMediaIndex]) === 'video' ? (
                <video 
                  src={gallery[activeMediaIndex]} 
                  controls 
                  autoPlay
                  muted
                  playsInline
                  style={{ width: '100%', maxHeight: '420px', borderRadius: '12px', objectFit: 'contain' }}
                />
              ) : (
                <img 
                  src={gallery[activeMediaIndex]} 
                  alt={product.name} 
                  style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '12px' }} 
                />
              )
            ) : (
              <div style={{ color: 'var(--text-secondary)' }}>📷 No Media Available</div>
            )}
          </div>

          {/* Thumbnail list for gallery */}
          {gallery.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', width: '100%' }}>
              {gallery.map((mediaUrl, idx) => {
                const isVideo = getMediaType(mediaUrl) === 'video';
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveMediaIndex(idx)}
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '8px',
                      border: activeMediaIndex === idx ? '2px solid var(--primary-color)' : '1px solid var(--card-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                      background: '#fff',
                      flexShrink: 0,
                      opacity: activeMediaIndex === idx ? 1 : 0.7,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isVideo ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                        <video src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                        <span style={{ position: 'absolute', fontSize: '1.2rem', color: '#fff', zIndex: 2 }}>🎥</span>
                      </div>
                    ) : (
                      <img src={mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Product specs & purchase block */}
        <div style={{ flex: '1 2 500px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>{product.category}</span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: 1.2, color: 'var(--text-primary)' }}>{product.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Seller ID: #{product.retailer_id} · Product Reference: #{product.id}</p>
          </div>

          {/* Pricing Grid */}
          <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(13,148,136,0.04)', borderColor: 'rgba(13,148,136,0.1)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Special Offer</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                <span className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: '800' }}>₹{selling.toFixed(2)}</span>
                {cost > selling && (
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{cost.toFixed(2)}</span>
                )}
              </div>
            </div>
            {cost > selling && (
              <span className="badge badge-accent" style={{ fontSize: '1rem', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '800' }}>
                🔥 {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Size option selector */}
          {sizesList.length > 0 && (
            <div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Select Size:</h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {sizesList.map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '8px',
                      border: selectedSize === sz ? '2px solid var(--primary-color)' : '1px solid var(--card-border)',
                      background: selectedSize === sz ? 'rgba(13,148,136,0.08)' : '#ffffff',
                      color: selectedSize === sz ? 'var(--primary-color)' : 'var(--text-primary)',
                      fontWeight: '700',
                      minWidth: '50px'
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h4 style={{ color: 'var(--text-secondary)' }}>Quantity:</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '1rem' }} 
                disabled={quantity <= 1}
                onClick={() => setQuantity(prev => prev - 1)}
              >
                -
              </button>
              <input 
                type="text" 
                readOnly
                value={quantity} 
                style={{ width: '45px', textAlign: 'center', padding: '0.25rem', marginBottom: 0, fontWeight: '700', fontSize: '0.95rem' }} 
              />
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '1rem' }} 
                disabled={quantity >= product.stock}
                onClick={() => setQuantity(prev => prev + 1)}
              >
                +
              </button>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({product.stock} units available)</span>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              className="btn-secondary glow-hover" 
              style={{ flex: 1, padding: '0.9rem' }}
              disabled={product.stock <= 0}
              onClick={handleAddToCartClick}
            >
              🛒 Add to Cart
            </button>
            <button 
              type="button" 
              className="btn-primary" 
              style={{ flex: 1, padding: '0.9rem' }}
              disabled={product.stock <= 0}
              onClick={handleOrderNowClick}
            >
              ⚡ Order Now
            </button>
          </div>

          {/* AI generated recommendation box */}
          <div className="glass-card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(255,255,255,0.7) 100%)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-color)' }}>
              🤖 ShopSphere AI Match
            </h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.5' }}>
              {(() => {
                if (!aiVerdict) return null;
                // Parse simple markdown: **bold** and *italics*
                const boldRegex = /\*\*(.*?)\*\*/g;
                let html = aiVerdict.replace(boldRegex, '<strong>$1</strong>');
                html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
                return html.split('\n').map((line, idx) => (
                  <div key={idx} dangerouslySetInnerHTML={{ __html: line }} style={{ minHeight: line ? 'auto' : '0.5rem' }} />
                ));
              })()}
            </div>
          </div>

        </div>
      </div>

      {/* Specifications Card */}
      <div className="glass-card">
        <h3 style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>📋 Specifications & Details</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
          {product.description || 'Premium curated catalog selection. Designed using high-quality materials and rigorous specifications compliance criteria.'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Material Grade</span>
            <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>Eco-friendly Organic / High spec</p>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Catalog Classification</span>
            <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{product.category}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Warranty period</span>
            <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>1 Year ShopSphere Protection</p>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Shipping dispatch</span>
            <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>Instant (Within 24 Hours)</p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Reviews List */}
        <div className="glass-card" style={{ flex: '2 1 500px' }}>
          <h3 style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            ⭐ Customer Reviews ({reviews.length})
          </h3>
          
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', padding: '2rem 0', textAlign: 'center' }}>No reviews yet for this product. Be the first to leave a comment!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map(rev => (
                <div key={rev.id} style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.95rem' }}>👤 {rev.username}</strong>
                    <span style={{ color: 'var(--warning-color)', fontWeight: '700' }}>
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem', lineHeight: '1.4' }}>{rev.comment}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                    {new Date(rev.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Review Form */}
        <div className="glass-card" style={{ flex: '1 1 300px', alignSelf: 'flex-start' }}>
          <h3 style={{ marginBottom: '1rem' }}>✍️ Write a Review</h3>
          
          {reviewSuccess && (
            <p style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: '600' }}>{reviewSuccess}</p>
          )}
          {reviewError && (
            <p style={{ color: 'var(--error-color)', fontSize: '0.85rem', marginBottom: '1rem' }}>⚠️ {reviewError}</p>
          )}

          <form onSubmit={handlePostReview}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Rating (Stars)</label>
              <select value={newRating} onChange={(e) => setNewRating(parseInt(e.target.value))} style={{ marginBottom: 0 }}>
                <option value="5">★★★★★ (5 Stars)</option>
                <option value="4">★★★★☆ (4 Stars)</option>
                <option value="3">★★★☆☆ (3 Stars)</option>
                <option value="2">★★☆☆☆ (2 Stars)</option>
                <option value="1">★☆☆☆☆ (1 Star)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Your Review Comment</label>
              <textarea 
                rows="4" 
                placeholder="Share your experience using this product..."
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)}
                required
                style={{ marginBottom: 0 }}
              />
            </div>

            <button type="submit" className="btn-primary w-full" style={{ padding: '0.7rem' }}>
              Publish Review ⭐
            </button>
          </form>
        </div>

      </div>

      {/* AI Smart Picks Slider / Recommended alternatives */}
      {recommendations.length > 0 && (
        <div>
          <h2 style={{ marginBottom: '1.25rem' }}>🤖 AI Smart Picks (Related Alternatives)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
            {recommendations.slice(0, 4).map(p => (
              <div key={p.id} className="glass-card glow-hover" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.5)' }}>
                <div className="product-image-container" style={{ height: '140px' }} onClick={() => navigate(`/product/${p.id}`)}>
                  <img src={p.image} alt={p.name} className="product-image" style={{ cursor: 'pointer' }} />
                </div>
                <h4 
                  onClick={() => navigate(`/product/${p.id}`)}
                  style={{ fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.5rem', cursor: 'pointer' }}
                >
                  {p.name}
                </h4>
                <div className="flex justify-between items-center" style={{ marginTop: '0.25rem' }}>
                  <span className="price-tag" style={{ fontSize: '1rem' }}>₹{p.price}</span>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} 
                    onClick={() => onAddToCart(p)}
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
