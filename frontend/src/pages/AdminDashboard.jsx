import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/admin/users');
      setUsers(res.data);
    } catch(err) {
      console.error(err);
      alert('Failed to fetch users');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/admin/users/${userId}/role`, { role: newRole });
      alert('Role updated successfully');
      fetchUsers();
    } catch(err) {
      alert('Failed to update role');
    }
  };

  return (
    <div className="mt-4">
      <h2 className="mb-4">Admin Dashboard</h2>
      
      <div className="glass-card">
        <h3>Platform Users Management</h3>
        <table className="mt-4">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Current Role</th>
              <th>Actions / Set Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{u.id}</td>
                <td>{u.username}</td>
                <td><span style={{
                  padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                  backgroundColor: u.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : u.role === 'retailer' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: u.role === 'admin' ? '#fca5a5' : u.role === 'retailer' ? '#6ee7b7' : '#93c5fd'
                }}>{u.role}</span></td>
                <td>
                  <select 
                    value={""} 
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    style={{width: 'auto', marginBottom: 0, padding: '0.25rem', marginRight: '0.5rem'}}
                  >
                    <option value="" disabled>Change Role</option>
                    <option value="user">User</option>
                    <option value="retailer">Retailer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
