import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import RetailerDashboard from './pages/RetailerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CartDrawer from './components/CartDrawer';
import CategoryPage from './pages/CategoryPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function App() {
  const { user } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState(() => {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState('');

  // Handle responsive resize for confetti canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = document.getElementById('confetti-canvas');
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const triggerConfetti = () => {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#10b981', '#f59e0b'];
    let particles = [];
    
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }
    
    let animationFrameId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let remaining = 0;
      
      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;
        
        if (p.y <= canvas.height) {
          remaining++;
        }
        
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });
      
      if (remaining > 0) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    
    draw();
    setTimeout(() => {
      cancelAnimationFrame(animationFrameId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 6000);
  };

  const handleAddToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      let newCart;
      if (existing) {
        newCart = prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        newCart = [...prev, { ...product, quantity: 1 }];
      }
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });

    // Animate navbar cart button
    const cartBtn = document.getElementById('navbar-cart-btn');
    if (cartBtn) {
      cartBtn.classList.add('bounce-active');
      setTimeout(() => cartBtn.classList.remove('bounce-active'), 400);
    }
  };

  const handleRemoveFromCart = (index) => {
    setCartItems(prev => {
      const newCart = [...prev];
      newCart.splice(index, 1);
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    localStorage.setItem('cart', '[]');
    setAppliedCoupon('');
  };

  const handleCheckoutSuccess = (orderData) => {
    triggerConfetti();
    handleClearCart();
    alert(`🎉 Checkout successful! Order ID: ${orderData.order_id}. You gained +${orderData.xp_gained} XP!`);
  };

  const handleWinCoupon = (code) => {
    triggerConfetti();
    setAppliedCoupon(code);
    alert(`🎟️ Coupon auto-copied to clipboard: ${code}! Use it at checkout.`);
    navigator.clipboard.writeText(code).catch(() => {});
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Router>
      <canvas id="confetti-canvas" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}></canvas>
      <Navbar cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home onAddToCart={handleAddToCart} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/category/:categoryName" element={<CategoryPage onAddToCart={handleAddToCart} />} />
          
          <Route path="/dashboard/user" element={
            <ProtectedRoute allowedRoles={['user', 'admin']}>
              <UserDashboard 
                cartItems={cartItems} 
                onRemoveFromCart={handleRemoveFromCart}
                onCheckoutSuccess={handleCheckoutSuccess}
                onWinCoupon={handleWinCoupon}
              />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/retailer" element={
            <ProtectedRoute allowedRoles={['retailer', 'admin']}>
              <RetailerDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onCheckoutSuccess={handleCheckoutSuccess}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={(code) => setAppliedCoupon(code)}
      />
    </Router>
  );
}

export default App;
