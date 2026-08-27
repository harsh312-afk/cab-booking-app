import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('user');
    console.log('[AUTH] useEffect - token:', token ? 'YES' : 'NO');
    console.log('[AUTH] useEffect - userInfo:', userInfo ? 'YES' : 'NO');
    if (token && userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        console.log('[AUTH] useEffect - parsed user:', parsedUser);
        setUser(parsedUser);
        console.log('[AUTH] useEffect - setUser called');
      } catch (e) {
        console.log('[AUTH] useEffect - JSON parse error:', e);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } else {
      console.log('[AUTH] useEffect - no token or userInfo');
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    console.log('[AUTH] login - START for:', email);
    try {
      console.log('[AUTH] login - calling API');
      const res = await api.post('/auth/login', { email, password });
      console.log('[AUTH] login - API response:', res.data);
      const { token, ...userData } = res.data;
      console.log('[AUTH] login - token:', token ? 'YES' : 'NO');
      console.log('[AUTH] login - userData:', userData);
      
      console.log('[AUTH] login - saving to localStorage');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('[AUTH] login - calling setUser');
      setUser(userData);
      console.log('[AUTH] login - setUser called');
      
      console.log('[AUTH] login - SUCCESS');
      return { success: true };
    } catch (err) {
      console.log('[AUTH] login - ERROR:', err);
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (name, email, password, phone, role = 'user') => {
    console.log('[AUTH] register - START for:', email);
    try {
      console.log('[AUTH] register - calling API');
      const res = await api.post('/auth/register', { name, email, password, phone, role });
      console.log('[AUTH] register - API response:', res.data);
      const { token, ...userData } = res.data;
      console.log('[AUTH] register - token:', token ? 'YES' : 'NO');
      console.log('[AUTH] register - userData:', userData);
      
      console.log('[AUTH] register - saving to localStorage');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('[AUTH] register - calling setUser');
      setUser(userData);
      console.log('[AUTH] register - setUser called');
      
      console.log('[AUTH] register - SUCCESS');
      return { success: true };
    } catch (err) {
      console.log('[AUTH] register - ERROR:', err);
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    console.log('[AUTH] logout - START');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('[AUTH] logout - END');
  };

  const updateUser = (updatedUser) => {
    console.log('[AUTH] updateUser - START:', updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    console.log('[AUTH] updateUser - END');
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
