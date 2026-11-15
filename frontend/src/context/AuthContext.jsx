import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, fetchCurrentUser } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('campusbite_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('campusbite_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Re-verify current user profile on app mount if token exists
  useEffect(() => {
    let isMounted = true;
    const verifyUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await fetchCurrentUser();
        if (isMounted) {
          setUser(userData);
          localStorage.setItem('campusbite_user', JSON.stringify(userData));
        }
      } catch (err) {
        // Token might be invalid or expired; clear state
        if (isMounted) {
          setToken(null);
          setUser(null);
          localStorage.removeItem('campusbite_token');
          localStorage.removeItem('campusbite_user');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifyUser();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setToken(data.access_token);
    localStorage.setItem('campusbite_token', data.access_token);

    // Fetch full user details with role
    const profile = await fetchCurrentUser();
    setUser(profile);
    localStorage.setItem('campusbite_user', JSON.stringify(profile));
    return profile;
  };

  const register = async (name, email, password, role) => {
    await registerUser(name, email, password, role);
    // Automatically log user in after successful registration
    return await login(email, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('campusbite_token');
    localStorage.removeItem('campusbite_user');
    localStorage.removeItem('campusbite_cart');
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    role: user?.role || null,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
