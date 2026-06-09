import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);
    try {
      const res = await axios.post('/auth/send-email-otp', { email });
      setOtpSent(true);
      setDemoOtp(res.data.demo_otp || '');
      
      let sentReal = res.data.real_time;
      let emailError = null;

      // If backend failed to send it directly via SMTP (e.g. Render port blocked), send it via EmailJS Client!
      if (!sentReal && res.data.demo_otp && window.emailjs) {
        try {
          const templateParams = {
            user_email: email,
            to_email: email,
            email: email,
            to: email,
            to_name: username || 'User',
            order_details: `🔑 Your ShopSphere registration verification code is: ${res.data.demo_otp}`,
            order_total: "Email OTP Verification Session"
          };
          await window.emailjs.send('service_9ez56f8', 'template_isb8uv7', templateParams);
          sentReal = true;
        } catch (e) {
          console.error('EmailJS sending failed:', e);
          emailError = e.text || e.message || String(e);
        }
      }

      if (sentReal) {
        setOtpSuccess('OTP verification code sent to your email address! Please check your inbox. 📧');
        setDemoOtp(''); // Clear demoOtp so we hide the sandbox key from the UI
      } else {
        setOtpSuccess('OTP Code generated! Enter it below to verify.');
        if (res.data.demo_otp) {
          alert(`💬 [EMAIL SANDBOX MOCK]\nTo: ${email}\nMessage: Your ShopSphere OTP verification code is: ${res.data.demo_otp}`);
        }
        if (emailError) {
          setOtpError(`Failed to send real email: ${emailError}. Falling back to sandbox.`);
        }
      }
    } catch (err) {
      console.error(err);
      setOtpError(err.response?.data?.error || 'Failed to send OTP. Ensure your email is correct.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError('');
    setOtpSuccess('');
    setOtpLoading(true);
    try {
      await axios.post('/auth/verify-email-otp', { email, otp });
      setIsVerified(true);
      setOtpSent(false);
      setOtpSuccess('Email address verified successfully! 🟢');
    } catch (err) {
      console.error(err);
      setOtpError(err.response?.data?.error || 'Invalid OTP code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      setError('Please verify your email address first!');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      await axios.post('/register', { 
        username, 
        password, 
        role, 
        mobile,
        email
      });
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
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
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
          {/* Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '0.2rem' }}>Username</label>
            <input 
              type="text" 
              placeholder="Pick a unique username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '0.2rem' }}>Password</label>
            <input 
              type="password" 
              placeholder="Choose a strong password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* Role Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '0.2rem' }}>Select Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ marginBottom: 0 }} disabled={loading}>
              <option value="user">🛒 Shopper (Earn Loyalty XP)</option>
              <option value="retailer">🏭 Retailer (Manage Inventory)</option>
              <option value="admin">🔧 Platform Admin</option>
            </select>
          </div>

          {/* Mobile Number */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '0.2rem' }}>Mobile Number</label>
            <input 
              type="tel" 
              placeholder="10-Digit Mobile Number" 
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').substring(0, 10))}
              required
              disabled={loading}
              style={{ marginBottom: 0 }}
            />
          </div>

          {/* Email Verification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '0.2rem' }}>Email Address (Compulsory Verification)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="email" 
                placeholder="Enter email to verify" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isVerified || loading || otpSent}
                style={{ marginBottom: 0, flex: 1 }}
              />
              {!isVerified && !otpSent && (
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleSendOtp} 
                  disabled={!email || otpLoading} 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                >
                  {otpLoading ? 'Sending...' : 'Send OTP'}
                </button>
              )}
            </div>
            
            {/* OTP Verification Input */}
            {otpSent && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <input 
                  type="text" 
                  placeholder="6-Digit OTP Code" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  required
                  style={{ marginBottom: 0, flex: 1 }}
                />
                <button 
                  type="button" 
                  className="btn-accent" 
                  onClick={handleVerifyOtp} 
                  disabled={otp.length < 6 || otpLoading} 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                >
                  Verify Code
                </button>
              </div>
            )}

            {/* OTP Status Messages */}
            {otpSuccess && <p style={{ color: 'var(--accent-color)', fontSize: '0.8rem', marginTop: '0.4rem', fontWeight: '600' }}>{otpSuccess}</p>}
            {otpError && <p style={{ color: 'var(--error-color)', fontSize: '0.8rem', marginTop: '0.4rem' }}>⚠️ {otpError}</p>}
            
            {demoOtp && !isVerified && (
              <div className="glass-card" style={{ padding: '0.5rem 0.75rem', marginTop: '0.5rem', background: 'rgba(13,148,136,0.04)', borderColor: 'rgba(13,148,136,0.1)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  🔑 Demo Email OTP Code: <strong style={{ color: 'var(--primary-color)' }}>{demoOtp}</strong> (copy to verify)
                </p>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full" 
            style={{ padding: '0.85rem' }} 
            disabled={loading || !isVerified}
          >
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
