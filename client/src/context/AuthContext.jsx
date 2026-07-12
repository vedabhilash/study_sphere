import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../utils/apiService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Set token in localStorage on token change
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user profile on startup or token change
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await authAPI.getMe();
        setUser(data);
      } catch (err) {
        console.error('Error loading user profile:', err);
        // If token expired or invalid, reset
        setToken('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Register User
  const register = async (name, email, password) => {
    try {
      const data = await authAPI.register(name, email, password);
      setToken(data.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Login User
  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      setToken(data.token);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Logout User
  const logout = () => {
    setToken('');
    setUser(null);
  };

  // Refresh user profile (useful when groups list changes)
  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await authAPI.getMe();
      setUser(data);
    } catch (err) {
      console.error('Error refreshing user profile:', err);
    }
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
