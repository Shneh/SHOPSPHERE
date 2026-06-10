import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

export default function RetailerDashboard() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', category: '', image: '' });
  const [editingId, setEditingId] = useState(null);

  // Media Gallery states
  const [mediaSource, setMediaSource] = useState('links'); // 'links' | 'gallery'
  const [mediaLinks, setMediaLinks] = useState(['']);
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState('dt7v4vj2g');
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState('shopsphere_preset');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

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

  const handleLinkChange = (index, value) => {
    const updated = [...mediaLinks];
    updated[index] = value;
    setMediaLinks(updated);
  };

  const handleAddLinkField = () => {
    if (mediaLinks.length < 10) {
      setMediaLinks([...mediaLinks, '']);
    }
  };

  const handleRemoveLinkField = (index) => {
    const updated = mediaLinks.filter((_, i) => i !== index);
    setMediaLinks(updated.length > 0 ? updated : ['']);
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    if (files.length > 10) {
      alert('⚠️ You can upload a maximum of 10 media files.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    const uploadedUrls = [];

    try {
      for (const file of files) {
        const formDataPayload = new FormData();
        formDataPayload.append('file', file);
        formDataPayload.append('upload_preset', cloudinaryUploadPreset);

        // Upload directly to Cloudinary using secure HTTPS REST API
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
          formDataPayload,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        
        if (res.data.secure_url) {
          uploadedUrls.push(res.data.secure_url);
        }
      }

      // Merge newly uploaded Cloudinary URLs into the media gallery
      const currentActive = mediaLinks.filter(url => url.trim() !== '');
      const merged = [...currentActive, ...uploadedUrls].slice(0, 10);
      setMediaLinks(merged.length > 0 ? merged : ['']);
      alert(`✅ Successfully uploaded and embedded ${uploadedUrls.length} file(s)!`);
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      setUploadError('Failed to upload some/all files. Verify your Cloud Name and Preset are correct.');
      alert('❌ Gallery upload failed. Please verify your Cloudinary Settings.');
    } finally {
      setIsUploading(false);
      e.target.value = null; // Clear file input
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      const activeLinks = mediaLinks.filter(url => url.trim() !== '');
      
      // Determine primary thumbnail image (preferring the first link that is not a video)
      const primaryImage = activeLinks.find(url => 
        !url.includes('/video/upload/') && 
        !url.toLowerCase().includes('.mp4') && 
        !url.toLowerCase().includes('.webm')
      ) || activeLinks[0] || '';

      const payload = {
        ...formData,
        image: primaryImage,
        media_gallery: activeLinks
      };

      if (editingId) {
        await axios.put(`/products/${editingId}`, payload);
        alert('Product updated!');
      } else {
        await axios.post('/products', payload);
        alert('Product added!');
      }
      setFormData({ name: '', price: '', stock: '', category: '', image: '' });
      setMediaLinks(['']);
      setEditingId(null);
      fetchProducts();
    } catch(err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setFormData({ name: p.name, price: p.price, stock: p.stock, category: p.category, image: p.image });
    
    // Parse the stored media gallery
    let gallery = [];
    if (p.media_gallery) {
      try {
        gallery = typeof p.media_gallery === 'string' ? JSON.parse(p.media_gallery) : p.media_gallery;
      } catch (err) {
        console.error('Failed to parse media_gallery:', err);
      }
    }
    
    if (!Array.isArray(gallery) || gallery.length === 0) {
      gallery = p.image ? [p.image] : [''];
    }
    setMediaLinks(gallery);
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
        <div className="glass-card" style={{flex: '1 1 350px'}}>
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
            
            {/* Premium Media Picker Option */}
            <div style={{ margin: '1.25rem 0', padding: '1rem', border: '1px solid var(--card-border)', borderRadius: '12px', background: 'rgba(0,0,0,0.02)' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>🖼️ Product Media (Photos & Videos)</h4>
              
              {/* Media Mode Selector */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setMediaSource('links')}
                  style={{
                    flex: 1,
                    padding: '0.4rem',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    border: mediaSource === 'links' ? '1px solid var(--primary-color)' : '1px solid var(--card-border)',
                    background: mediaSource === 'links' ? 'var(--primary-color)' : 'white',
                    color: mediaSource === 'links' ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  🔗 Paste Links
                </button>
                <button
                  type="button"
                  onClick={() => setMediaSource('gallery')}
                  style={{
                    flex: 1,
                    padding: '0.4rem',
                    fontSize: '0.8rem',
                    borderRadius: '8px',
                    border: mediaSource === 'gallery' ? '1px solid var(--primary-color)' : '1px solid var(--card-border)',
                    background: mediaSource === 'gallery' ? 'var(--primary-color)' : 'white',
                    color: mediaSource === 'gallery' ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  📷 Upload Gallery
                </button>
              </div>

              {mediaSource === 'links' ? (
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Enter up to 10 URLs for product images or MP4/WebM video clips:
                  </p>
                  {mediaLinks.map((link, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <input
                        type="url"
                        placeholder={`Media #${idx + 1} URL`}
                        value={link}
                        onChange={e => handleLinkChange(idx, e.target.value)}
                        style={{ marginBottom: 0, fontSize: '0.8rem', padding: '0.4rem' }}
                      />
                      {mediaLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLinkField(idx)}
                          style={{ padding: '0.2rem 0.4rem', border: 'none', background: 'transparent', color: '#ef4444', fontSize: '1rem', cursor: 'pointer' }}
                        >
                          ❌
                        </button>
                      )}
                    </div>
                  ))}
                  {mediaLinks.length < 10 && (
                    <button
                      type="button"
                      onClick={handleAddLinkField}
                      className="btn-secondary"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginTop: '0.25rem', width: '100%' }}
                    >
                      ➕ Add Another Media Link ({10 - mediaLinks.length} remaining)
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Select image files from your local gallery to upload them to Cloudinary:
                  </p>
                  
                  {/* Collapsible Cloudinary Configuration settings for ease of customization */}
                  <details style={{ marginBottom: '0.75rem', border: '1px dashed var(--card-border)', borderRadius: '8px', padding: '0.4rem' }}>
                    <summary style={{ fontSize: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}>⚙️ Cloudinary Settings</summary>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.1rem' }}>Cloud Name</label>
                        <input
                          type="text"
                          placeholder="Cloud Name"
                          value={cloudinaryCloudName}
                          onChange={e => setCloudinaryCloudName(e.target.value)}
                          style={{ padding: '0.3rem', fontSize: '0.75rem', marginBottom: 0 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.1rem' }}>Upload Preset (unsigned)</label>
                        <input
                          type="text"
                          placeholder="Upload Preset"
                          value={cloudinaryUploadPreset}
                          onChange={e => setCloudinaryUploadPreset(e.target.value)}
                          style={{ padding: '0.3rem', fontSize: '0.75rem', marginBottom: 0 }}
                        />
                      </div>
                    </div>
                  </details>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    disabled={isUploading}
                    style={{ fontSize: '0.8rem', padding: '0.5rem', border: '1px solid var(--card-border)', borderRadius: '8px', width: '100%', marginBottom: 0 }}
                  />
                  
                  {isUploading && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                      ⚡ Uploading gallery files to Cloudinary...
                    </div>
                  )}
                  {uploadError && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--error-color)' }}>
                      ⚠️ {uploadError}
                    </div>
                  )}

                  {/* Show embedded links preview */}
                  {mediaLinks.filter(url => url.trim() !== '').length > 0 && (
                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--card-border)', paddingTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Embedded URLs ({mediaLinks.filter(url => url.trim() !== '').length}):</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem', maxHeight: '120px', overflowY: 'auto' }}>
                        {mediaLinks.filter(url => url.trim() !== '').map((url, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', background: '#f8fafc', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            <span style={{ fontSize: '0.7rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                              {url}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const filtered = mediaLinks.filter((_, idx) => idx !== mediaLinks.indexOf(url));
                                setMediaLinks(filtered.length > 0 ? filtered : ['']);
                              }}
                              style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" style={{flex: 1}}>{editingId ? 'Update' : 'Add'}</button>
              {editingId && <button type="button" className="btn-secondary" onClick={() => {setEditingId(null); setFormData({name:'', price:'', stock:'', category:'', image:''}); setMediaLinks(['']);}}>Cancel</button>}
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
