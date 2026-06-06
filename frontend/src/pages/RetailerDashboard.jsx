import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function RetailerDashboard() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', category: '', image: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/products');
      // Filter out products not owned by the retailer
      const retailerProducts = res.data.filter(p => p.retailer_id === user.id);
      setProducts(retailerProducts);
    } catch(err) {
      console.error(err);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/products/${editingId}`, formData);
        alert('Product updated!');
      } else {
        await axios.post('/products', formData);
        alert('Product added!');
      }
      setFormData({ name: '', price: '', stock: '', category: '', image: '' });
      setEditingId(null);
      fetchProducts();
    } catch(err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setFormData({ name: p.name, price: p.price, stock: p.stock, category: p.category, image: p.image });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`/products/${id}`);
      fetchProducts();
    } catch(err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="mt-4">
      <h2 className="mb-4">Retailer Dashboard</h2>
      
      <div className="flex gap-2" style={{alignItems: 'flex-start', flexWrap: 'wrap'}}>
        <div className="glass-card" style={{flex: '1 1 300px'}}>
          <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <form className="mt-4" onSubmit={handleCreateOrUpdate}>
            <input type="text" placeholder="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input type="number" placeholder="Price (₹)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            <input type="number" placeholder="Stock Quantity" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option value="">Select Category</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Grocery">Grocery</option>
              <option value="Home & Furniture">Home & Furniture</option>
              <option value="Books & Education">Books & Education</option>
            </select>
            <input type="url" placeholder="Image URL (optional)" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
            
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" style={{flex: 1}}>{editingId ? 'Update' : 'Add'}</button>
              {editingId && <button type="button" className="btn-secondary" onClick={() => {setEditingId(null); setFormData({name:'', price:'', stock:'', category:'', image:''})}}>Cancel</button>}
            </div>
          </form>
        </div>

        <div className="glass-card" style={{flex: '2 1 500px'}}>
          <h3>Your Products Inventory</h3>
          <table className="mt-4">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>₹{p.price}</td>
                  <td style={{color: p.stock < 5 ? '#ef4444' : 'inherit'}}>{p.stock}</td>
                  <td>{p.category}</td>
                  <td>
                    <button className="btn-secondary" style={{padding: '0.25rem 0.5rem', marginRight: '0.5rem'}} onClick={() => handleEdit(p)}>Edit</button>
                    <button className="btn-secondary" style={{padding: '0.25rem 0.5rem', borderColor: '#ef4444', color: '#ef4444'}} onClick={() => handleDelete(p.id)}>Del</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan="5" className="text-center">No products found. Add one!</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
