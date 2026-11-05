import React, { createContext, useContext, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crewlink_user')) || null; }
    catch { return null; }
  });

  async function emailAuth(mode, values) {
    const { data } = await api.post(mode === 'register' ? '/auth/register' : '/auth/login', values);
    localStorage.setItem('crewlink_token', data.token);
    localStorage.setItem('crewlink_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }

  async function googleLogin(credential) {
    const { data } = await api.post('/auth/google', { credential });
    localStorage.setItem('crewlink_token', data.token);
    localStorage.setItem('crewlink_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }

  async function updateProfile(values) {
    const { data } = await api.put('/users/profile', values);
    localStorage.setItem('crewlink_user', JSON.stringify(data));
    setUser(data);
    return data;
  }

  function logout() {
    localStorage.removeItem('crewlink_token');
    localStorage.removeItem('crewlink_user');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, googleLogin, emailAuth, updateProfile, logout }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
