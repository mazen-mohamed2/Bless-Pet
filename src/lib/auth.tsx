import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Api } from './api';

interface AuthContextType {
  token: string | null;
  username: string | null;
  isEnvAuth: boolean;
  login: (u: string, p: string) => Promise<void>;
  signup?: (
    u: string,
    p: string,
    email: string,
    firstName: string,
    lastName: string,
    phone: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const APP_USERNAME = import.meta.env.VITE_APP_USERNAME as string | undefined;
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD as string | undefined;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'));

  const isEnvAuth = Boolean(APP_USERNAME && APP_PASSWORD);
console.log("import.meta.env.VITE_APP_USERNAME ",import.meta.env.VITE_APP_USERNAME );

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    if (username) localStorage.setItem('username', username);
    else localStorage.removeItem('username');
  }, [token, username]);

  const login = useCallback(async (u: string, p: string) => {
    if (isEnvAuth) {
      if (u === APP_USERNAME && p === APP_PASSWORD) {
        setToken('local-session');
        setUsername(u);
        return;
      }
      throw new Error('Invalid credentials');
    }
    const res = await Api.loginPetstore(u, p);
    setToken(res.token);
    setUsername(u);
  }, [isEnvAuth]);

  const signup = useMemo(() => {
    if (isEnvAuth) return undefined;
    
    return async (
      u: string,
      p: string,
      email: string,
      firstName: string,
      lastName: string,
      phone: string
    ) => {
      await Api.createUser(u, p, email, firstName, lastName, phone);
      await login(u, p);
    };
  }, [isEnvAuth, login]);

  const logout = useCallback(() => {
    setToken(null);
    setUsername(null);
  }, []);

  const value = useMemo(
    () => ({ token, username, login, logout, signup, isEnvAuth }),
    [token, username, login, logout, signup, isEnvAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};   