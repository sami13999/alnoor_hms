import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('alnoor_token') || null);
  const [loading, setLoading] = useState(true);
  const [testUsers, setTestUsers] = useState([]);

  useEffect(() => {
    // Fetch test users for role quick switcher
    api.get('/auth/test-users')
      .then(res => {
        if (res.data.success) {
          setTestUsers(res.data.data);
        }
      })
      .catch(() => {});

    // Restore user session if token exists
    if (token) {
      api.get('/auth/me')
        .then(res => {
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            logout();
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      // Auto login as receptionist for development convenience if no token
      quickSwitch('receptionist1').finally(() => setLoading(false));
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('alnoor_token', res.data.token);
      localStorage.setItem('alnoor_user', JSON.stringify(res.data.user));
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const quickSwitch = async (roleOrUsername) => {
    try {
      const res = await api.post('/auth/quick-switch', { roleOrUsername });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('alnoor_token', res.data.token);
        localStorage.setItem('alnoor_user', JSON.stringify(res.data.user));
        return res.data;
      }
    } catch (err) {
      console.error('Quick switch failed:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (token) await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('alnoor_token');
      localStorage.removeItem('alnoor_user');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      testUsers,
      role: user?.role_name || user?.roleName || 'GUEST',
      login,
      quickSwitch,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

