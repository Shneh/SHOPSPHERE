import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function Checkout({ cartItems, onCheckoutSuccess }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Form states for Shipping Address
  const [houseNo, setHouseNo] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [postOffice, setPostOffice] = useState('');
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cart math
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate potential spin-wheel coupon discounts
  const appliedCoupon = localStorage.getItem('appliedCoupon') || '';
  const discountPercent = appliedCoupon === 'SPIN5' ? 5 : appliedCoupon === 'SPIN10' ? 10 : appliedCoupon === 'SPIN15' ? 15 : 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const grandTotal = subtotal - discountAmount;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (cartItems.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    if (!houseNo || !area || !city || !pincode || !state || !country) {
      setError('Please fill in all mandatory shipping address fields.');
      return;
    }

    setLoading(true);

    const shippingAddress = {
      house_no: houseNo,
      area: area,
      landmark: landmark,
      city: city,
      post_office: postOffice,
      pincode: pincode,
      state: state,
      country: country
    };

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/checkout', {
        cart: cartItems,
        total: grandTotal,
        coupon: appliedCoupon,
        shipping_address: shippingAddress
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Clear any stored coupon
      localStorage.removeItem('appliedCoupon');
      
      // Callback to trigger confetti and reset cart
      onCheckoutSuccess(res.data);
      
      // Redirect to the user's dashboard to see order lists
      navigate(`/dashboard/${user?.role || 'user'}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Order placement failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="glass-card text-center" style={{ marginTop: '4rem', padding: '3rem' }}>
        <p style={{ fontSize: '3rem' }}>🛒</p>
        <h2>Your Shopping Cart is Empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Add items to your cart before proceeding to checkout.</p>
        <button className="btn-primary mt-4" onClick={() => navigate('/')}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease' }}>
      
      <div>
        <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>🧾 Complete Your Order</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Review invoice details and enter shipping address information below</p>
      </div>

      {error && (
        <div className="glass-card" style={{ padding: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.1)', textAlign: 'center' }}>
          <p style={{ color: 'var(--error-color)', fontSize: '0.85rem', fontWeight: '500' }}>⚠️ {error}</p>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Shipping address form card */}
        <div className="glass-card" style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', margin: 0 }}>📍 Shipping Destination</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>H. No. / Flat No. / Street No. *</label>
              <input type="text" placeholder="e.g. Flat 402, Street 15" value={houseNo} onChange={(e) => setHouseNo(e.target.value)} required style={{ marginBottom: 0 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Area / Locality *</label>
              <input type="text" placeholder="e.g. Green Meadows" value={area} onChange={(e) => setArea(e.target.value)} required style={{ marginBottom: 0 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Landmark / Features</label>
              <input type="text" placeholder="e.g. Near Central Park Mall" value={landmark} onChange={(e) => setLandmark(e.target.value)} style={{ marginBottom: 0 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Village / City *</label>
              <input type="text" placeholder="e.g. New Delhi" value={city} onChange={(e) => setCity(e.target.value)} required style={{ marginBottom: 0 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Nearest Post Office</label>
              <input type="text" placeholder="e.g. GPO Sector 4" value={postOffice} onChange={(e) => setPostOffice(e.target.value)} style={{ marginBottom: 0 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Area PIN Code *</label>
              <input type="text" placeholder="e.g. 110001" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').substring(0, 6))} required style={{ marginBottom: 0 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>State *</label>
              <input type="text" placeholder="e.g. Delhi" value={state} onChange={(e) => setState(e.target.value)} required style={{ marginBottom: 0 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Country *</label>
              <input type="text" placeholder="e.g. India" value={country} onChange={(e) => setCountry(e.target.value)} required style={{ marginBottom: 0 }} />
            </div>
          </div>

          <h3 style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', margin: '1rem 0 0 0' }}>💳 Payment Method</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {['card', 'upi', 'cod'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '10px',
                  border: paymentMethod === m ? '2px solid var(--primary-color)' : '1px solid var(--card-border)',
                  background: paymentMethod === m ? 'rgba(13,148,136,0.08)' : '#ffffff',
                  color: paymentMethod === m ? 'var(--primary-color)' : 'var(--text-primary)',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  flex: '1 1 120px'
                }}
              >
                {m === 'card' ? '💳 Card' : m === 'upi' ? '⚡ UPI' : '💵 Cash COD'}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice review card */}
        <div className="glass-card" style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '90px' }}>
          <h3 style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', margin: 0 }}>🛍️ Items Summary</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {cartItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <div style={{ maxWidth: '70%' }}>
                  <span style={{ fontWeight: '600' }}>{item.name}</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Size: {item.selectedSize || 'unisized'} · Qty: {item.quantity}</p>
                </div>
                <strong>₹{(item.price * item.quantity).toFixed(2)}</strong>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="flex justify-between" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between" style={{ fontSize: '0.9rem', color: 'var(--accent-color)' }}>
                <span>Discount ({discountPercent}%):</span>
                <span>- ₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between" style={{ fontWeight: '700', fontSize: '1.2rem', borderTop: '1px solid var(--card-border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
              <span>Invoice Total:</span>
              <span className="text-gradient">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full" 
            style={{ padding: '0.9rem', fontSize: '1rem' }} 
            disabled={loading}
          >
            {loading ? 'Processing transaction...' : `Place Order & Pay ₹${grandTotal.toFixed(2)} 🚀`}
          </button>
        </div>

      </form>
    </div>
  );
}
