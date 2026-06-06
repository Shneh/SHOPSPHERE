import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import RewardsHub from '../components/RewardsHub';

export default function UserDashboard({ onWinCoupon }) {
  const { user, setUser } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('rewards'); // 'rewards' or 'orders'

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Dashboard Header Banner */}
      <div className="glass-card" style={{ 
        padding: '2rem', 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(17, 24, 39, 0.8) 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>Shopper Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, <span className="text-gradient" style={{ fontWeight: '600' }}>{user.username}</span>!</p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
          <button 
            className={activeTab === 'rewards' ? 'btn-primary' : 'btn-secondary'} 
            onClick={() => setActiveTab('rewards')}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px' }}
          >
            🏆 Rewards Hub
          </button>
          <button 
            className={activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'} 
            onClick={() => setActiveTab('orders')}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px' }}
          >
            📦 Order History
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'rewards' ? (
        <RewardsHub 
          user={user} 
          onUpdateUser={handleUpdateUser} 
          onWinCoupon={onWinCoupon}
        />
      ) : (
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem' }}>Your Orders</h3>
          
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</p>
              <h4>No orders found</h4>
              <p>Items you purchase will show up here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {orders.map(o => (
                <div key={o.id} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--card-border)' }}>
                  <div className="flex justify-between items-center" style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order ID:</span>
                      <strong style={{ marginLeft: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>#{o.id}</strong>
                    </div>
                    <span className="badge badge-accent">Paid</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Items:</span>
                      <span style={{ fontWeight: '500' }}>
                        {o.cart && o.cart.map(i => `${i.name} (x${i.quantity || 1})`).join(', ')}
                      </span>
                    </div>
                    <div className="flex justify-between" style={{ marginTop: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total Paid:</span>
                      <strong className="text-gradient" style={{ fontSize: '1.15rem' }}>₹{o.total}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
