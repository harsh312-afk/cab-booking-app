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
    console.log('[Auth] useEffect: Reading from localStorage');
    console.log('[Auth] useEffect: token:', token ? 'present' : 'null');
    console.log('[Auth] useEffect: userInfo:', userInfo ? 'present' : 'null');
    if (token && userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        console.log('[Auth] useEffect: Setting user from localStorage:', parsedUser);
        setUser(parsedUser);
      } catch (e) {
        console.log('[Auth] useEffect: Error parsing user from localStorage:', e);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } else {
      console.log('[Auth] useEffect: No token or userInfo found');
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    console.log('[Auth] login: Attempting login for', email);
    try {
      console.log('[Auth] login: Calling API POST /auth/login');
      const res = await api.post('/auth/login', { email, password });
      console.log('[Auth] login: API response status:', res.status);
      console.log('[Auth] login: API response data:', res.data);
      
      if (!res.data || !res.data.token) {
        console.log('[Auth] login: Invalid response format - missing token');
        return { success: false, message: 'Invalid server response' };
      }
      
      const { token, ...userData } = res.data;
      console.log('[Auth] login: Extracted token:', token ? 'present (+' + token.length + ' chars)' : 'null');
      console.log('[Auth] login: Extracted userData:', userData);
      
      // Validate userData
      if (!userData || !userData._id || !userData.email) {
        console.log('[Auth] login: Invalid userData format:', userData);
        return { success: false, message: 'Invalid user data from server' };
      }
      
      console.log('[Auth] login: Saving to localStorage');
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('[Auth] login: Saved to localStorage successfully');
      } catch (e) {
        console.log('[Auth] login: Error saving to localStorage:', e);
        return { success: false, message: 'Failed to save session data' };
      }
      
      console.log('[Auth] login: Calling setUser');
      try {
        setUser(userData);
        console.log('[Auth] login: setUser called successfully');
      } catch (e) {
        console.log('[Auth] login: Error in setUser:', e);
        return { success: false, message: 'Failed to update authentication state' };
      }
      
      console.log('[Auth] login: Login successful');
      return { success: true };
    } catch (err) {
      console.log('[Auth] login: Error occurred:', err);
      console.log('[Auth] login: Error config:', err.config);
      console.log('[Auth] login: Error request:', err.request);
      if (err.response) {
        console.log('[Auth] login: Error response status:', err.response.status);
        console.log('[Auth] login: Error response data:', err.response.data);
        return { success: false, message: err.response.data?.message || err.response.statusText || 'Login failed' };
      } else if (err.request) {
        console.log('[Auth] login: Error request:', err.request);
        return { success: false, message: 'Network error - unable to reach server' };
      } else {
        console.log('[Auth] login: Error message:', err.message);
        return { success: false, message: err.message || 'Login failed' };
      }
    }
  };

  const register = async (name, email, password, phone, role = 'user') => {
    console.log('[Auth] register: Attempting registration for', email);
    try {
      console.log('[Auth] register: Calling API POST /auth/register');
      const res = await api.post('/auth/register', { name, email, password, phone, role });
      console.log('[Auth] register: API response status:', res.status);
      console.log('[Auth] register: API response data:', res.data);
      
      if (!res.data || !res.data.token) {
        console.log('[Auth] register: Invalid response format - missing token');
        return { success: false, message: 'Invalid server response' };
      }
      
      const { token, ...userData } = res.data;
      console.log('[Auth] register: Extracted token:', token ? 'present (+' + token.length + ' chars)' : 'null');
      console.log('[Auth] register: Extracted userData:', userData);
      
      // Validate userData
      if (!userData || !userData._id || !userData.email) {
        console.log('[Auth] register: Invalid userData format:', userData);
        return { success: false, message: 'Invalid user data from server' };
      }
      
      console.log('[Auth] register: Saving to localStorage');
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('[Auth] register: Saved to localStorage successfully');
      } catch (e) {
        console.log('[Auth] register: Error saving to localStorage:', e);
        return { success: false, message: 'Failed to save session data' };
      }
      
      console.log('[Auth] register: Calling setUser');
      try {
        setUser(userData);
        console.log('[Auth] register: setUser called successfully');
      } catch (e) {
        console.log('[Auth] register: Error in setUser:', e);
        return { success: false, message: 'Failed to update authentication state' };
      }
      
      console.log('[Auth] register: Registration successful');
      return { success: true };
    } catch (err) {
      console.log('[Auth] register: Error occurred:', err);
      console.log('[Auth] register: Error config:', err.config);
      console.log('[Auth] register: Error request:', err.request);
      if (err.response) {
        console.log('[Auth] register: Error response status:', err.response.status);
        console.log('[Auth] register: Error response data:', err.response.data);
        return { success: false, message: err.response.data?.message || err.response.statusText || 'Registration failed' };
      } else if (err.request) {
        console.log('[Auth] register: Error request:', err.request);
        return { success: false, message: 'Network error - unable to reach server' };
      } else {
        console.log('[Auth] register: Error message:', err.message);
        return { success: false, message: err.message || 'Registration failed' };
      }
    }
  };

  const logout = () => {
    console.log('[Auth] logout: Logging out');
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {
      console.log('[Auth] logout: Error clearing localStorage:', e);
    }
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    console.log('[Auth] updateUser: Updating user:', updatedUser);
    try {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (e) {
      console.log('[Auth] updateUser: Error saving user to localStorage:', e);
    }
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
