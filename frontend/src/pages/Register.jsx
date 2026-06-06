import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, password, role);
      alert('🎉 Registration successful! Welcome to ShopSphere. Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try a different username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex animate-fade" style={{ minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '3rem' }}>🏆</span>
          <h2 style={{ fontSize: '1.8rem', marginTop: '0.5rem', marginBottom: '0.4rem' }}>Join ShopSphere</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Create an account and start earning XP rewards</p>
        </div>

        {error && (
          <div className="glass-card" style={{ padding: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.1)', marginBottom: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--error-color)', fontSize: '0.85rem', fontWeight: '500' }}>⚠️ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '0.2rem' }}>Username</label>
            <input 
              type="text" 
              placeholder="Pick a unique username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ marginBottom: 0 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '0.2rem' }}>Password</label>
            <input 
              type="password" 
              placeholder="Choose a strong password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ marginBottom: 0 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '0.2rem' }}>Select Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ marginBottom: 0 }}>
              <option value="user">🛒 Shopper (Earn Loyalty XP)</option>
              <option value="retailer">🏭 Retailer (Manage Inventory)</option>
              <option value="admin">🔧 Platform Admin</option>
            </select>
          </div>

          <button type="submit" className="btn-primary w-full" style={{ padding: '0.85rem' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account 🚀'}
          </button>
        </form>

        <p className="text-center mt-4" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
}
