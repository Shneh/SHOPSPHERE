import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function RewardsHub({ user, onUpdateUser, onWinCoupon }) {
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [dailySuccess, setDailySuccess] = useState('');
  const [dailyError, setDailyError] = useState('');
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Spin Wheel configuration
  const rewards = [
    { type: 'discount', value: 5, label: '5% OFF', color: '#6366f1', code: 'SPIN5' },
    { type: 'xp', value: 100, label: '100 XP', color: '#8b5cf6', code: '' },
    { type: 'discount', value: 10, label: '10% OFF', color: '#ec4899', code: 'SPIN10' },
    { type: 'points', value: 50, label: '50 PTS', color: '#10b981', code: '' },
    { type: 'discount', value: 15, label: '15% OFF', color: '#f43f5e', code: 'SPIN15' },
    { type: 'xp', value: 250, label: '250 XP', color: '#f59e0b', code: '' }
  ];

  // Loyalty levels logic
  const getLevelInfo = (xp) => {
    if (xp < 500) return { name: 'Bronze Shopper', min: 0, max: 500, discount: 0, color: '#cd7f32' };
    if (xp < 1500) return { name: 'Silver Shopper', min: 500, max: 1500, discount: 3, color: '#c0c0c0' };
    if (xp < 4000) return { name: 'Gold Shopper', min: 1500, max: 4000, discount: 5, color: '#ffd700' };
    return { name: 'Platinum Shopper', min: 4000, max: 10000, discount: 8, color: '#e5e4e2' };
  };

  const level = getLevelInfo(user.xp);
  const progressPercent = Math.min(((user.xp - level.min) / (level.max - level.min)) * 100, 100);

  // Drawing the wheel
  useEffect(() => {
    drawWheel(0);
  }, []);

  const drawWheel = (angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const radius = width / 2;
    const sliceAngle = (2 * Math.PI) / rewards.length;

    ctx.clearRect(0, 0, width, height);

    rewards.forEach((reward, i) => {
      const currentAngle = angle + i * sliceAngle;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius - 10, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = reward.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(currentAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Outfit, sans-serif';
      ctx.fillText(reward.label, radius - 30, 5);
      ctx.restore();
    });

    // Draw outer metallic ring
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 5, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 10;
    ctx.stroke();
  };

  const spin = async () => {
    if (spinning) return;
    setErrorMsg('');
    setSpinResult('');

    if (user.points < 30 && user.xp >= 300) {
      setErrorMsg('Insufficient points! You need 30 points to spin.');
      return;
    }

    setSpinning(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/user/spin', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const serverReward = res.data.reward;
      
      // Find matching index in client reward list to stop wheel at
      let rewardIndex = rewards.findIndex(
        r => r.type === serverReward.type && r.value === serverReward.value
      );
      if (rewardIndex === -1) rewardIndex = 0;

      // Spin physics variables
      const sliceAngle = (2 * Math.PI) / rewards.length;
      // Target angle places index at top pointer (angle is measured from 3 o'clock, so pointer is at -Math.PI / 2)
      const targetOffset = -Math.PI / 2 - (rewardIndex * sliceAngle) - (sliceAngle / 2);
      
      let currentAngle = 0;
      let speed = 0.45; // Initial radial velocity
      const friction = 0.982; // Easing friction multiplier
      const minSpeed = 0.002;
      
      const animateSpin = () => {
        currentAngle += speed;
        speed *= friction;
        
        drawWheel(currentAngle);
        
        if (speed > minSpeed) {
          animationRef.current = requestAnimationFrame(animateSpin);
        } else {
          // Finished spinning, snap to target offset precisely and present reward
          drawWheel(targetOffset);
          setSpinning(false);
          
          if (serverReward.type === 'discount') {
            setSpinResult(`🎉 You won a ${serverReward.label}! Code: ${serverReward.code}`);
            if (onWinCoupon) onWinCoupon(serverReward.code);
          } else {
            setSpinResult(`🎉 You won ${serverReward.label}!`);
          }
          
          // Trigger callbacks to update main state
          onUpdateUser({
            ...user,
            xp: res.data.xp,
            points: res.data.points,
            badges: res.data.badges
          });
        }
      };
      
      animateSpin();

    } catch (err) {
      setSpinning(false);
      setErrorMsg(err.response?.data?.error || 'Spin failed.');
    }
  };

  const handleDailyCheckin = async () => {
    setDailySuccess('');
    setDailyError('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/user/daily-checkin', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDailySuccess(`Check-in successful! Gained +${res.data.xp_gained} XP and +${res.data.points_gained} Points! Current Streak: ${res.data.streak}🔥`);
      
      onUpdateUser({
        ...user,
        xp: res.data.xp,
        points: res.data.points,
        badges: res.data.badges
      });
    } catch (err) {
      setDailyError(err.response?.data?.error || 'Check-in failed. Have you already checked in today?');
    }
  };

  const hasBadge = (badgeName) => {
    return user.badges && user.badges.includes(badgeName);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Loyalty Status Grid */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem' }}>Loyalty Progress</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Level up to unlock permanent discount tiers!</p>
          </div>
          <span className="badge" style={{ backgroundColor: level.color, color: '#111827', fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
            🏆 {level.name}
          </span>
        </div>

        <div className="reward-progress-container">
          <div className="flex justify-between" style={{ fontSize: '0.9rem' }}>
            <span>XP: <strong>{user.xp}</strong></span>
            <span>Next Level: <strong>{level.max} XP</strong></span>
          </div>
          <div className="progress-track">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            ✨ current status: <strong>{level.discount}% permanent checkout discount</strong> applied automatically.
          </p>
        </div>

        {/* Status statistics */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <div className="glass-card" style={{ flex: 1, padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: '1.8rem' }}>🪙</span>
            <h4 style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>{user.points}</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reward Points</p>
          </div>
          <div className="glass-card" style={{ flex: 1, padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: '1.8rem' }}>🔥</span>
            <h4 style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>Daily Streak</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Check-in Streak</p>
          </div>
        </div>
      </div>

      {/* Daily Check-in Card & Spin Wheel */}
      <div className="flex-row-wrap" style={{ gap: '2rem' }}>
        {/* Spin Wheel */}
        <div className="glass-card col-main" style={{ textAlign: 'center', minWidth: '320px' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>🎯 Spin the Fortune Wheel</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Cost: 30 Points. Spin to unlock XP and Coupons!
          </p>

          <div className="wheel-canvas-container">
            <div className="wheel-pointer"></div>
            <div className="wheel-center-pin"></div>
            <canvas ref={canvasRef} width="280" height="280"></canvas>
          </div>

          <button className="btn-primary" onClick={spin} disabled={spinning} style={{ width: '180px', margin: '0 auto' }}>
            {spinning ? 'Spinning...' : '🎰 Spin (30 pts)'}
          </button>
          
          {spinResult && <p style={{ color: 'var(--accent-color)', fontWeight: '600', marginTop: '1rem' }}>{spinResult}</p>}
          {errorMsg && <p style={{ color: 'var(--error-color)', fontSize: '0.9rem', marginTop: '1rem' }}>{errorMsg}</p>}
        </div>

        {/* Daily Streak Check-in */}
        <div className="glass-card col-sidebar" style={{ minWidth: '280px' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>📅 Daily check-in</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Claim daily loyalty points and increase your XP bonus streak!
          </p>

          <button className="btn-accent w-full" onClick={handleDailyCheckin} style={{ padding: '1rem' }}>
            ✔️ Check In Today
          </button>

          {dailySuccess && <p style={{ color: 'var(--accent-color)', fontSize: '0.9rem', marginTop: '1rem', fontWeight: '600' }}>{dailySuccess}</p>}
          {dailyError && <p style={{ color: 'var(--warning-color)', fontSize: '0.9rem', marginTop: '1rem' }}>{dailyError}</p>}
          
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Streak Multipliers:</h4>
            <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>• Day 1 check-in: +50 XP</li>
              <li>• Day 2 check-in: +100 XP</li>
              <li>• Day 3 check-in: +150 XP (+Streak Hero Badge!)</li>
              <li>• Day 4+ check-in: +200 XP</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Badges Achievements */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '0.5rem' }}>🏆 Achievements & Badges</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Unlock badges to gain extra loyalty milestones.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Badge 1: welcome */}
          <div className="glass-card glow-hover" style={{ 
            padding: '1rem', 
            display: 'flex', 
            gap: '1rem', 
            alignItems: 'center', 
            background: hasBadge('welcome') ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)',
            filter: hasBadge('welcome') ? 'none' : 'grayscale(1)'
          }}>
            <span style={{ fontSize: '2.5rem' }}>👋</span>
            <div>
              <h4 style={{ fontSize: '0.95rem' }}>Welcome Aboard</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Create your account (+200 XP)</p>
              <span className="badge badge-primary" style={{ marginTop: '0.4rem', fontSize: '0.65rem' }}>
                {hasBadge('welcome') ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          </div>

          {/* Badge 2: first_purchase */}
          <div className="glass-card glow-hover" style={{ 
            padding: '1rem', 
            display: 'flex', 
            gap: '1rem', 
            alignItems: 'center', 
            background: hasBadge('first_purchase') ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
            filter: hasBadge('first_purchase') ? 'none' : 'grayscale(1)'
          }}>
            <span style={{ fontSize: '2.5rem' }}>🛍️</span>
            <div>
              <h4 style={{ fontSize: '0.95rem' }}>First Cart</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Place first checkout (+200 XP)</p>
              <span className="badge badge-accent" style={{ marginTop: '0.4rem', fontSize: '0.65rem' }}>
                {hasBadge('first_purchase') ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          </div>

          {/* Badge 3: high_roller */}
          <div className="glass-card glow-hover" style={{ 
            padding: '1rem', 
            display: 'flex', 
            gap: '1rem', 
            alignItems: 'center', 
            background: hasBadge('high_roller') ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.02)',
            filter: hasBadge('high_roller') ? 'none' : 'grayscale(1)'
          }}>
            <span style={{ fontSize: '2.5rem' }}>💎</span>
            <div>
              <h4 style={{ fontSize: '0.95rem' }}>High Roller</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Order over ₹1000 (+300 XP)</p>
              <span className="badge badge-warning" style={{ marginTop: '0.4rem', fontSize: '0.65rem' }}>
                {hasBadge('high_roller') ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          </div>

          {/* Badge 4: streak_hero */}
          <div className="glass-card glow-hover" style={{ 
            padding: '1rem', 
            display: 'flex', 
            gap: '1rem', 
            alignItems: 'center', 
            background: hasBadge('streak_hero') ? 'rgba(236, 72, 153, 0.05)' : 'rgba(255,255,255,0.02)',
            filter: hasBadge('streak_hero') ? 'none' : 'grayscale(1)'
          }}>
            <span style={{ fontSize: '2.5rem' }}>⚡</span>
            <div>
              <h4 style={{ fontSize: '0.95rem' }}>Streak Hero</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Consecutive 3-day Check-in</p>
              <span className="badge badge-primary" style={{ marginTop: '0.4rem', fontSize: '0.65rem', color: '#ec4899', borderColor: '#ec4899' }}>
                {hasBadge('streak_hero') ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          </div>

          {/* Badge 5: coupon_king */}
          <div className="glass-card glow-hover" style={{ 
            padding: '1rem', 
            display: 'flex', 
            gap: '1rem', 
            alignItems: 'center', 
            background: hasBadge('coupon_king') ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)',
            filter: hasBadge('coupon_king') ? 'none' : 'grayscale(1)'
          }}>
            <span style={{ fontSize: '2.5rem' }}>🏷️</span>
            <div>
              <h4 style={{ fontSize: '0.95rem' }}>Coupon King</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Win a discount from Wheel</p>
              <span className="badge badge-primary" style={{ marginTop: '0.4rem', fontSize: '0.65rem' }}>
                {hasBadge('coupon_king') ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
