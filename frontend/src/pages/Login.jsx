import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Lock, User } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(username, password);
      setTimeout(() => navigate(`/dashboard/${res.user.role}`), 200);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: '#f5f5f7'
    }}>
      {/* Left panel — brand */}
      <div style={{
        background: 'linear-gradient(150deg, #1d1d1f 0%, #2d2d2f 60%, #1a1a2e 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '320px', height: '320px',
          background: 'radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', left: '-60px',
          width: '280px', height: '280px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: '900', fontSize: '1rem'
          }}>S</div>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.03em' }}>ShopSphere</span>
        </div>

        {/* Hero text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Welcome back
          </p>
          <h1 style={{
            color: 'white', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
            fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1.15',
            marginBottom: '1.25rem'
          }}>
            Your personal<br />
            <span style={{
              background: 'linear-gradient(90deg, #818cf8, #c4b5fd)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>shopping universe</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '320px' }}>
            Discover millions of products, track your rewards, and get AI-powered recommendations tailored just for you.
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '2rem', position: 'relative', zIndex: 1 }}>
          {[['10K+', 'Products'], ['5-star', 'Rating'], ['Fast', 'Delivery']].map(([val, label]) => (
            <div key={label}>
              <p style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>{val}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '500', marginTop: '0.1rem' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        background: '#ffffff'
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
              Sign in
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--indigo)', fontWeight: '600', textDecoration: 'none' }}>
                Create one
              </Link>
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(244,63,94,0.06)',
              border: '1px solid rgba(244,63,94,0.18)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: 'var(--rose)',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {/* Username */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-icon-wrap">
                <User size={15} className="input-icon" />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  style={{ marginBottom: 0 }}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap" style={{ position: 'relative' }}>
                <Lock size={15} className="input-icon" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ marginBottom: 0, paddingRight: '2.8rem', paddingLeft: '2.5rem' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', padding: '0', cursor: 'pointer',
                    color: 'var(--text-tertiary)', display: 'flex'
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary btn-lg w-full"
              style={{ marginTop: '0.75rem', borderRadius: '12px', gap: '0.5rem' }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ opacity: 0.7 }}>Signing in…</span>
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Mobile: collapse left panel */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: '1fr 1fr'"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="background: 'linear-gradient(150deg"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
