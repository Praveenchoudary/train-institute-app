// ══════════════════════════════════════════════════════════════════
//  AuthContext.js
//
//  Provides: user, loading, login(), register(), logout(), isAdmin
//
//  On app load:
//    1. Reads JWT from localStorage
//    2. Calls GET /api/auth/me to verify token + hydrate user object
//    3. Sets loading=false — PrivateRoute can now decide to redirect
// ══════════════════════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);  // true until first /me call resolves

  const loadUser = useCallback(async () => {
    if (!localStorage.getItem('token')) { setLoading(false); return; }
    try {
      const res = await authAPI.me();
      setUser(res.data);
    } catch {
      localStorage.removeItem('token');   // invalid/expired token
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
};
