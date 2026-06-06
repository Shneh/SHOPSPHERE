import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar({ cartCount, onOpenCart }) {
  const { user, logout } = useContext(AuthContext);

  const getLevelName = (xp) => {
    if (!xp) return 'Bronze';
    if (xp < 500) return 'Bronze';
    if (xp < 1500) return 'Silver';
    if (xp < 4000) return 'Gold';
    return 'Platinum';
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span>✨</span> ShopSphere
      </Link>
      <div className="navbar-nav">
        {user ? (
          <>
            {user.role === 'user' && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginRight: '0.5rem' }}>
                <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                  🏆 {getLevelName(user.xp)}
                </span>
                <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                  🪙 {user.points} pts
                </span>
              </div>
            )}
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Hi, {user.username}</span>
            <Link to={`/dashboard/${user.role}`} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Dashboard</Link>
            
            {user.role === 'user' && (
              <button id="navbar-cart-btn" className="btn-accent" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={onOpenCart}>
                🛒 Cart ({cartCount})
              </button>
            )}

            <button onClick={logout} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Login</Link>
            <Link to="/register" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
