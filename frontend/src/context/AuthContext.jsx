import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/client';

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
  const [loading, setLoading] = useState(!!getStoredToken());

  useEffect(() => {
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }
    getMe()
      .then((res) => {
        setUser(res.data);
        if (localStorage.getItem('token')) {
          localStorage.setItem('user', JSON.stringify(res.data));
        } else {
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

  const login = (userData, token, remember = true) => {
    setUser(userData);
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
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
