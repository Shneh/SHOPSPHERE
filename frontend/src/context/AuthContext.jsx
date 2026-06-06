import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize user state from localStorage cache for instant loading
  const [user, setUserState] = useState(() => {
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Configure axios base
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:10000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Asynchronously verify session in background, but keep user cached in the meantime
          axios.get('/me')
            .then(res => {
              setUser(res.data);
            })
            .catch(() => {
              logout();
            });
        }
      } catch (e) {
        logout();
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const setUser = (userData) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  };

  const login = async (username, password) => {
    const res = await axios.post('/login', { username, password });
    localStorage.setItem('token', res.data.token);
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data.user);
    return res.data;
  };

  const register = async (username, password, role) => {
    const res = await axios.post('/register', { username, password, role });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, register }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
