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
    console.log('AuthContext useEffect: Reading from localStorage');
    console.log('AuthContext useEffect: token:', token ? 'present' : 'null');
    console.log('AuthContext useEffect: userInfo:', userInfo ? 'present' : 'null');
    if (token && userInfo) {
      const parsedUser = JSON.parse(userInfo);
      console.log('AuthContext useEffect: Setting user from localStorage:', parsedUser);
      setUser(parsedUser);
    } else {
      console.log('AuthContext useEffect: No token or userInfo found');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    console.log('AuthContext login: Attempting login for', email);
    try {
      console.log('AuthContext login: Calling API');
      const res = await api.post('/auth/login', { email, password });
      console.log('AuthContext login: API response received:', res.data);
      const { token, ...userData } = res.data;
      console.log('AuthContext login: Extracted token:', token ? 'present' : 'null');
      console.log('AuthContext login: Extracted userData:', userData);
      
      console.log('AuthContext login: Saving to localStorage');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('AuthContext login: Calling setUser');
      setUser(userData);
      
      console.log('AuthContext login: Login successful');
      return { success: true };
    } catch (err) {
      console.log('AuthContext login: Error occurred:', err);
      console.log('AuthContext login: Error response:', err.response);
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (name, email, password, phone, role = 'user') => {
    console.log('AuthContext register: Attempting registration for', email);
    try {
      console.log('AuthContext register: Calling API');
      const res = await api.post('/auth/register', { name, email, password, phone, role });
      console.log('AuthContext register: API response received:', res.data);
      const { token, ...userData } = res.data;
      console.log('AuthContext register: Extracted token:', token ? 'present' : 'null');
      console.log('AuthContext register: Extracted userData:', userData);
      
      console.log('AuthContext register: Saving to localStorage');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('AuthContext register: Calling setUser');
      setUser(userData);
      
      console.log('AuthContext register: Registration successful');
      return { success: true };
    } catch (err) {
      console.log('AuthContext register: Error occurred:', err);
      console.log('AuthContext register: Error response:', err.response);
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = () => {
    console.log('AuthContext logout: Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    console.log('AuthContext updateUser: Updating user:', updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
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
