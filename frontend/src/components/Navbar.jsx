import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShoppingBag, LayoutDashboard, LogOut, LogIn, UserPlus } from 'lucide-react';

export default function Navbar({ cartCount, onOpenCart }) {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const getLevelName = (xp) => {
    if (!xp || xp < 500) return 'Bronze';
    if (xp < 1500) return 'Silver';
    if (xp < 4000) return 'Gold';
    return 'Platinum';
  };

  const levelColors = { Bronze: '#cd7f32', Silver: '#94a3b8', Gold: '#f59e0b', Platinum: '#8b5cf6' };
  const level = getLevelName(user?.xp);

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
        <div className="brand-mark">S</div>
        <span>ShopSphere</span>
      </Link>

      {/* Nav */}
      <div className="navbar-nav">
        {user ? (
          <>
            {/* Level badge — only for shoppers */}
            {user.role === 'user' && (
              <span style={{
                fontSize: '0.72rem', fontWeight: '700',
                color: levelColors[level],
                background: `${levelColors[level]}14`,
                border: `1px solid ${levelColors[level]}22`,
                padding: '0.2rem 0.65rem', borderRadius: '100px',
                letterSpacing: '0.02em'
              }}>
                {level}
              </span>
            )}

            {/* Points — only for shoppers */}
            {user.role === 'user' && (
              <span style={{
                fontSize: '0.78rem', fontWeight: '600',
                color: 'var(--text-secondary)'
              }}>
                {user.points ?? 0} pts
              </span>
            )}

            {/* User pill */}
            <Link
              to={`/dashboard/${user.role}`}
              className="nav-user-pill"
              style={{ textDecoration: 'none' }}
            >
              <div className="nav-avatar">{user.username?.[0]}</div>
              {user.username}
            </Link>

            {/* Cart — only for shoppers */}
            {user.role === 'user' && (
              <button
                id="navbar-cart-btn"
                onClick={onOpenCart}
                style={{
                  position: 'relative',
                  background: 'var(--bg-alt)',
                  border: '1px solid var(--border)',
                  borderRadius: '100px',
                  padding: '0.42rem 1rem 0.42rem 0.75rem',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  fontSize: '0.85rem', fontWeight: '600',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  boxShadow: 'var(--shadow-xs)'
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.14)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <ShoppingBag size={15} />
                Cart
                {cartCount > 0 && (
                  <span style={{
                    background: 'var(--indigo)', color: 'white',
                    borderRadius: '100px', fontSize: '0.68rem', fontWeight: '700',
                    padding: '0.08rem 0.42rem', minWidth: '18px', textAlign: 'center'
                  }}>
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Logout */}
            <button
              onClick={logout}
              className="btn-ghost btn-sm"
              style={{ color: 'var(--text-secondary)', gap: '0.35rem' }}
            >
              <LogOut size={14} />
              <span style={{ display: 'none' }}>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-secondary btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <LogIn size={14} /> Login
            </Link>
            <Link to="/register" className="btn-indigo btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <UserPlus size={14} /> Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
