import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logout as apiLogout } from '../api/client';

const AuthContext = createContext(null);
const getStoredToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');
const getStoredUser = () => localStorage.getItem('user') || sessionStorage.getItem('user');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = getStoredUser();
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((res) => {
        setUser(res.data);
        if (localStorage.getItem('token')) {
          localStorage.setItem('user', JSON.stringify(res.data));
        } else if (sessionStorage.getItem('token')) {
          sessionStorage.setItem('user', JSON.stringify(res.data));
        }
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (userData, token = '', remember = true) => {
    setUser(userData);
    const hasToken = Boolean(String(token || '').trim());

    if (!hasToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      return;
    }

    if (remember) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      return;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('token', token);
  };

  const logout = () => {
    apiLogout().catch(() => {});
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  const updateUser = (updater) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };

      if (localStorage.getItem('token')) {
        localStorage.setItem('user', JSON.stringify(next));
      } else if (sessionStorage.getItem('token')) {
        sessionStorage.setItem('user', JSON.stringify(next));
      }

      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
