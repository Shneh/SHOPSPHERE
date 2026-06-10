import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cartItems, 
  onRemoveItem, 
  onUpdateQuantity,
  onCheckoutSuccess,
  appliedCoupon,
  onApplyCoupon
}) {
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const grandTotal = subtotal - discountAmount;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    if (!couponCode) return;

    try {
      const res = await axios.post('/apply_discount', {
        total: subtotal,
        code: couponCode
      });
      if (res.data.applied) {
        // Valid coupon code
        const pct = couponCode === 'SPIN5' ? 5 : couponCode === 'SPIN10' ? 10 : couponCode === 'SPIN15' ? 15 : 0;
        setDiscountPercent(pct);
        setCouponSuccess(`Coupon applied! Saved ${pct}% off.`);
        if (onApplyCoupon) onApplyCoupon(couponCode);
      } else {
        setCouponError('Invalid coupon code!');
        setDiscountPercent(0);
      }
    } catch (err) {
      setCouponError('Failed to apply discount.');
      setDiscountPercent(0);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', appliedCoupon);
    } else {
      localStorage.removeItem('appliedCoupon');
    }
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-header">
          <h2>🛒 Your Cart</h2>
          <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={onClose}>✕ Close</button>
        </div>

        <div className="cart-drawer-content">
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍</p>
              <p>Your shopping cart is empty.</p>
              <button className="btn-primary mt-4" onClick={onClose}>Start Shopping</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cartItems.map((item, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', background: '#1e293b', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>No Img</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{item.name}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>₹{item.price}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Size: {item.selectedSize || 'unisized'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem' }}>
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', borderRadius: '4px', height: 'auto', minHeight: 'auto' }} 
                        onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', borderRadius: '4px', height: 'auto', minHeight: 'auto' }} 
                        onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button className="btn-danger" style={{ padding: '0.35rem 0.6rem', borderRadius: '6px' }} onClick={() => onRemoveItem(idx)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between" style={{ color: 'var(--accent-color)' }}>
                  <span>Discount ({discountPercent}%):</span>
                  <span>- ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between" style={{ fontWeight: '700', fontSize: '1.2rem', borderTop: '1px solid var(--card-border)', paddingTop: '0.5rem' }}>
                <span>Total:</span>
                <span className="text-gradient">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Coupon Box */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Discount Code" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                style={{ marginBottom: 0, padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Apply</button>
            </form>
            {couponError && <p style={{ color: 'var(--error-color)', fontSize: '0.8rem', marginBottom: '1rem' }}>{couponError}</p>}
            {couponSuccess && <p style={{ color: 'var(--accent-color)', fontSize: '0.8rem', marginBottom: '1rem' }}>{couponSuccess}</p>}

            <button className="btn-primary w-full" onClick={handleCheckout}>
              Checkout and Pay ₹{grandTotal.toFixed(2)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
