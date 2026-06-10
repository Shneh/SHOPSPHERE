import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Tab control: 'overview' | 'users' | 'products' | 'orders'
  const [activeTab, setActiveTab] = useState('overview');

  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Product inline edit state
  const [editingProductId, setEditingProductId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');

  // Add Product form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Electronics');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('');
  const [newProductImage, setNewProductImage] = useState('');

  // Add User form state
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [newUserMobile, setNewUserMobile] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [addUserLoading, setAddUserLoading] = useState(false);

  // Low stock input state for quick refills
  const [refillQuantities, setRefillQuantities] = useState({});

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        axios.get('/admin/users'),
        axios.get('/products'),
        axios.get('/orders')
      ]);
      setUsers(usersRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      alert('⚠️ Error loading dashboard records. Make sure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  // ----- USERS ACTIONS -----
  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/admin/users/${userId}/role`, { role: newRole });
      alert('✅ User role updated successfully!');
      fetchInitialData();
    } catch (err) {
      alert('❌ Failed to update user role.');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`⚠️ Are you sure you want to permanently delete the account for "${username}"?\nThis action cannot be undone.`)) {
      return;
    }
    try {
      await axios.delete(`/admin/users/${userId}`);
      alert('🗑️ User account deleted successfully.');
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.error || '❌ Failed to delete user account.');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserUsername || !newUserPassword || !newUserMobile || !newUserEmail) {
      alert('⚠️ Please fill out all required fields!');
      return;
    }
    setAddUserLoading(true);
    try {
      await axios.post('/admin/users', {
        username: newUserUsername,
        password: newUserPassword,
        role: newUserRole,
        mobile: newUserMobile,
        email: newUserEmail
      });
      alert('✅ User created successfully!');
      // Reset form
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserRole('user');
      setNewUserMobile('');
      setNewUserEmail('');
      setShowAddUserForm(false);
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.error || '❌ Failed to create user account.');
    } finally {
      setAddUserLoading(false);
    }
  };

  // ----- PRODUCTS ACTIONS -----
  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setEditPrice(product.price);
    setEditStock(product.stock);
  };

  const handleUpdateProduct = async (productId) => {
    try {
      await axios.put(`/products/${productId}`, {
        price: parseFloat(editPrice),
        stock: parseInt(editStock, 10)
      });
      alert('✅ Product price and stock updated!');
      setEditingProductId(null);
      fetchInitialData();
    } catch (err) {
      alert('❌ Failed to update product details.');
    }
  };

  const handleQuickRefill = async (productId, amount) => {
    const refillVal = parseInt(amount, 10);
    if (isNaN(refillVal) || refillVal <= 0) {
      alert('Please enter a valid positive number to refill.');
      return;
    }
    const currentProd = products.find(p => p.id === productId);
    if (!currentProd) return;
    
    try {
      await axios.put(`/products/${productId}`, {
        price: currentProd.price,
        stock: currentProd.stock + refillVal
      });
      alert(`✅ Successfully added ${refillVal} items to stock!`);
      setRefillQuantities(prev => ({ ...prev, [productId]: '' }));
      fetchInitialData();
    } catch (err) {
      alert('❌ Failed to refill stock.');
    }
  };

  const handleDeleteProduct = async (productId, name) => {
    if (!window.confirm(`⚠️ Are you sure you want to delete "${name}" from the product catalog?`)) {
      return;
    }
    try {
      await axios.delete(`/products/${productId}`);
      alert('🗑️ Product deleted successfully.');
      fetchInitialData();
    } catch (err) {
      alert('❌ Failed to delete product.');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice || !newProductStock) {
      alert('Please fill out all required fields.');
      return;
    }
    try {
      await axios.post('/products', {
        name: newProductName,
        category: newProductCategory,
        price: parseFloat(newProductPrice),
        stock: parseInt(newProductStock, 10),
        image: newProductImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'
      });
      alert('🎉 New product listed successfully!');
      setShowAddForm(false);
      setNewProductName('');
      setNewProductPrice('');
      setNewProductStock('');
      setNewProductImage('');
      fetchInitialData();
    } catch (err) {
      alert('❌ Failed to list product.');
    }
  };

  // ----- ORDERS ACTIONS -----
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.put(`/admin/orders/${orderId}`, { status: newStatus });
      alert('✅ Order status updated successfully!');
      fetchInitialData();
    } catch (err) {
      alert('❌ Failed to update order status.');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`⚠️ Permanent Delete: Are you sure you want to remove order record #${orderId}?\nThis will modify total revenue logs.`)) {
      return;
    }
    try {
      await axios.delete(`/admin/orders/${orderId}`);
      alert('🗑️ Order record removed.');
      fetchInitialData();
    } catch (err) {
      alert('❌ Failed to delete order record.');
    }
  };

  // ----- METRIC COMPUTATIONS -----
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = validOrders.length > 0 ? (totalRevenue / validOrders.length) : 0;
  
  const customerCount = users.filter(u => u.role === 'user').length;
  const retailerCount = users.filter(u => u.role === 'retailer').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  
  const lowStockProducts = products.filter(p => p.stock < 5);

  // ----- FILTER RUNNERS -----
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
                          (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredProducts = products.filter(p => {
    return p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
           (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()));
  });

  const filteredOrders = orders.filter(o => {
    const orderIdStr = String(o.id);
    const buyerEmailStr = o.email ? o.email.toLowerCase() : '';
    const matchesSearch = orderIdStr.includes(orderSearch) || buyerEmailStr.includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getLevelName = (xp) => {
    if (!xp) return 'Bronze';
    if (xp < 500) return 'Bronze';
    if (xp < 1500) return 'Silver';
    if (xp < 4000) return 'Gold';
    return 'Platinum';
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'delivered': return { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'shipped': return { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'cancelled': return { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
      default: return { background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }; // paid / pending
    }
  };

  return (
    <div style={{ marginTop: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Header Panel */}
      <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.75rem', background: 'var(--primary-gradient)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: '800' }}>Platform Administration</h1>
            <p style={{ opacity: 0.9, fontSize: '0.9rem', marginTop: '0.25rem' }}>Manage users, review financial statements, and curate catalogs</p>
          </div>
          <button 
            onClick={fetchInitialData} 
            className="btn-secondary glow-hover" 
            style={{ color: 'var(--primary-color)', borderRadius: '12px', padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none' }}
          >
            🔄 {loading ? 'Syncing...' : 'Sync Logs'}
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {[
          { id: 'overview', label: '📊 Overview', desc: 'KPI Metrics & Alerts' },
          { id: 'users', label: '👥 User Profiles', desc: 'Customers & Retailers' },
          { id: 'products', label: '🛒 Product Catalog', desc: 'Listing & Inventories' },
          { id: 'orders', label: '🧾 Transactions', desc: 'Sales Ledger & Revenue' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.8rem 1.4rem',
              borderRadius: '12px',
              border: activeTab === t.id ? '1px solid rgba(13,148,136,0.3)' : '1px solid var(--card-border)',
              background: activeTab === t.id ? 'var(--card-bg-solid)' : 'rgba(255, 255, 255, 0.4)',
              color: activeTab === t.id ? 'var(--primary-color)' : 'var(--text-secondary)',
              boxShadow: activeTab === t.id ? 'var(--shadow-sm)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              flex: '1 1 180px',
              textAlign: 'left',
              gap: '0.15rem'
            }}
          >
            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{t.label}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: '400' }}>{t.desc}</span>
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2.5rem', background: 'rgba(13, 148, 136, 0.1)', padding: '0.75rem', borderRadius: '12px', lineHeight: 1 }}>💼</div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Gross Revenue</p>
                <h3 style={{ fontSize: '1.75rem', margin: 0, fontWeight: '800', color: 'var(--primary-color)' }}>₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2.5rem', background: 'rgba(244, 63, 94, 0.1)', padding: '0.75rem', borderRadius: '12px', lineHeight: 1 }}>🧾</div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Sales Count</p>
                <h3 style={{ fontSize: '1.75rem', margin: 0, fontWeight: '800' }}>{orders.length} <span style={{fontSize: '0.8rem', fontWeight: '400', color: 'var(--text-muted)'}}>({validOrders.length} Paid)</span></h3>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '12px', lineHeight: 1 }}>👥</div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Active Profiles</p>
                <h3 style={{ fontSize: '1.75rem', margin: 0, fontWeight: '800' }}>{users.length}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{customerCount} Shoppers · {retailerCount} Sellers</span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ fontSize: '2.5rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '12px', lineHeight: 1 }}>⚡</div>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>Average Ticket</p>
                <h3 style={{ fontSize: '1.75rem', margin: 0, fontWeight: '800' }}>₹{avgOrderValue.toFixed(2)}</h3>
              </div>
            </div>
          </div>

          {/* Alerts / Low Stock Card */}
          <div className="glass-card glow-hover">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⚠️ Low Stock Alert Center
                <span className="badge badge-danger" style={{ borderRadius: '6px' }}>{lowStockProducts.length} Items</span>
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Items with under 5 units left</span>
            </div>

            {lowStockProducts.length === 0 ? (
              <p style={{ color: 'var(--accent-color)', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem 0' }}>✅ Excellent! All catalog products have sufficient stock levels.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {lowStockProducts.map(p => (
                  <div key={p.id} className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.9)', boxShadow: 'none', border: '1px solid rgba(239, 68, 68, 0.12)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <img src={p.image} alt={p.name} style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{p.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category: {p.category}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem' }}>Current stock: <strong style={{ color: 'var(--error-color)' }}>{p.stock}</strong></span>
                      <div style={{ display: 'flex', gap: '0.25rem', maxWidth: '140px' }}>
                        <input
                          type="number"
                          placeholder="+Qty"
                          min="1"
                          value={refillQuantities[p.id] || ''}
                          onChange={(e) => setRefillQuantities(prev => ({ ...prev, [p.id]: e.target.value }))}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginBottom: 0, textAlign: 'center' }}
                        />
                        <button
                          onClick={() => handleQuickRefill(p.id, refillQuantities[p.id])}
                          className="btn-primary"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '8px' }}
                        >
                          Refill
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* USERS MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
          
          {/* Add User Collapsible Panel */}
          <div className="glass-card animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowAddUserForm(!showAddUserForm)}>
              <h3 style={{ margin: 0 }}>👥 Create New User Profile (Shopper/Seller/Admin)</h3>
              <span style={{ fontSize: '1.2rem' }}>{showAddUserForm ? '▲' : '▼'}</span>
            </div>

            {showAddUserForm && (
              <form onSubmit={handleAddUser} style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Username *</label>
                  <input type="text" placeholder="e.g. shopper99" value={newUserUsername} onChange={(e) => setNewUserUsername(e.target.value)} required style={{ marginBottom: 0 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Password *</label>
                  <input type="password" placeholder="Password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required style={{ marginBottom: 0 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Email Address *</label>
                  <input type="email" placeholder="email@example.com" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required style={{ marginBottom: 0 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Mobile Number *</label>
                  <input type="tel" placeholder="e.g. +91 9999999999" value={newUserMobile} onChange={(e) => setNewUserMobile(e.target.value)} required style={{ marginBottom: 0 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Account Role *</label>
                  <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} style={{ marginBottom: 0 }}>
                    <option value="user">🛒 Shopper (Customer)</option>
                    <option value="retailer">🏭 Seller (Retailer)</option>
                    <option value="admin">🔧 Admin (Platform Administrator)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: '1 / -1' }}>
                  <button type="submit" disabled={addUserLoading} className="btn-primary glow-hover" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px' }}>
                    {addUserLoading ? 'Creating Profile...' : 'Create Account'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="glass-card animate-fade">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ margin: 0 }}>Registered Account Records</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search username or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', width: '220px', marginBottom: 0, fontSize: '0.85rem' }}
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', width: '150px', marginBottom: 0, fontSize: '0.85rem' }}
              >
                <option value="all">👥 All Roles</option>
                <option value="user">🛒 Shoppers</option>
                <option value="retailer">🏭 Sellers</option>
                <option value="admin">🔧 Admins</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Contact Details</th>
                  <th>XP/Rank</th>
                  <th>Streak</th>
                  <th>Role</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{u.id}</td>
                    <td style={{ fontWeight: '600' }}>{u.username}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span style={{ fontSize: '0.85rem' }}>📧 {u.email || 'No email registered'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📱 {u.mobile || 'No mobile registered'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem', width: 'max-content', marginBottom: '0.2rem' }}>
                          🏆 {getLevelName(u.xp)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          XP: <strong>{u.xp || 0}</strong> · pts: <strong>{u.points || 0}</strong>
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem' }}>🔥 {u.streak || 1} day streak</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Active: {u.last_active || 'Never'}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700',
                        backgroundColor: u.role === 'admin' ? 'rgba(239, 68, 68, 0.12)' : u.role === 'retailer' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(14, 165, 233, 0.12)',
                        color: u.role === 'admin' ? '#ef4444' : u.role === 'retailer' ? '#0d9488' : '#0ea5e9'
                      }}>{u.role.toUpperCase()}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{ width: 'auto', marginBottom: 0, padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#f8fafc' }}
                        >
                          <option value="user">User</option>
                          <option value="retailer">Retailer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="btn-danger"
                          style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No users match the search filters.</p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Add Product Collapsible Panel */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowAddForm(!showAddForm)}>
              <h3 style={{ margin: 0 }}>➕ List New Product on Platform</h3>
              <span style={{ fontSize: '1.2rem' }}>{showAddForm ? '▲' : '▼'}</span>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddProduct} style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Product Name *</label>
                  <input type="text" placeholder="e.g. Premium Mug" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} required style={{ marginBottom: 0 }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Category *</label>
                  <select value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)} style={{ marginBottom: 0 }}>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Home & Furniture">Home & Furniture</option>
                    <option value="Books & Education">Books & Education</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Price (₹) *</label>
                  <input type="number" step="0.01" placeholder="e.g. 599.00" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} required style={{ marginBottom: 0 }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Initial Stock *</label>
                  <input type="number" placeholder="e.g. 25" value={newProductStock} onChange={(e) => setNewProductStock(e.target.value)} required style={{ marginBottom: 0 }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Image URL (Unsplash/Web)</label>
                  <input type="url" placeholder="https://..." value={newProductImage} onChange={(e) => setNewProductImage(e.target.value)} style={{ marginBottom: 0 }} />
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" className="btn-secondary" style={{ padding: '0.4rem 1rem' }} onClick={() => setShowAddForm(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ padding: '0.4rem 1.2rem' }}>Save & Launch 🚀</button>
                </div>
              </form>
            )}
          </div>

          {/* Product List Table */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ margin: 0 }}>Itemized Inventory Catalog</h3>
              <input
                type="text"
                placeholder="🔍 Search items by name or category..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', width: '250px', marginBottom: 0, fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const isEditing = editingProductId === p.id;
                    return (
                      <tr key={p.id}>
                        <td>
                          <img src={p.image} alt={p.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                        </td>
                        <td style={{ fontWeight: '600' }}>{p.name}</td>
                        <td>
                          <span className="badge badge-primary">{p.category}</span>
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              style={{ width: '90px', padding: '0.25rem', marginBottom: 0, fontSize: '0.85rem' }}
                            />
                          ) : (
                            <span>₹{p.price.toFixed(2)}</span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editStock}
                              onChange={(e) => setEditStock(e.target.value)}
                              style={{ width: '70px', padding: '0.25rem', marginBottom: 0, fontSize: '0.85rem' }}
                            />
                          ) : (
                            <span className="badge" style={{
                              backgroundColor: p.stock === 0 ? 'rgba(239, 68, 68, 0.12)' : p.stock < 5 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                              color: p.stock === 0 ? '#ef4444' : p.stock < 5 ? '#f59e0b' : '#10b981'
                            }}>
                              {p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} units`}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleUpdateProduct(p.id)}
                                  className="btn-primary"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingProductId(null)}
                                  className="btn-secondary"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditProduct(p)}
                                  className="btn-secondary"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id, p.name)}
                                  className="btn-danger"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No products match filters.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ORDERS & REVENUE TAB */}
      {activeTab === 'orders' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0 }}>Sales Audit Ledger</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search order ID or buyer email..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', width: '220px', marginBottom: 0, fontSize: '0.85rem' }}
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                style={{ padding: '0.4rem 0.8rem', width: '150px', marginBottom: 0, fontSize: '0.85rem' }}
              >
                <option value="all">🧾 All Orders</option>
                <option value="paid">🟡 Paid / Process</option>
                <option value="shipped">🔵 Shipped</option>
                <option value="delivered">🟢 Delivered</option>
                <option value="cancelled">🔴 Cancelled</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Email</th>
                  <th>Date & Time</th>
                  <th>Ordered Cart Items</th>
                  <th>Invoice Total</th>
                  <th>Delivery Status</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: '700' }}>#{o.id}</td>
                    <td>{o.email || <em style={{color:'var(--text-muted)'}}>No email logged</em>}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(o.timestamp).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', maxWidth: '300px' }}>
                        {o.cart && o.cart.length > 0 ? (
                          o.cart.map((item, idx) => (
                            <span key={idx} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              🛍️ {item.name} x {item.quantity} (₹{item.price})
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Empty checkout data</span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: '700' }}>₹{o.total.toFixed(2)}</td>
                    <td>
                      <span className="badge" style={getStatusStyle(o.status)}>
                        {o.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <select
                          value={o.status}
                          onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                          style={{ width: 'auto', marginBottom: 0, padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#f8fafc' }}
                        >
                          <option value="paid">Paid</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => handleDeleteOrder(o.id)}
                          className="btn-danger"
                          style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No transactions match search criteria.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
