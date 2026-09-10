import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { api, setAuthToken, type User } from '@/services/api';

const STORAGE_KEY = 'runown.auth';

type AuthState = {
  user: User | null;
  isLoading: boolean;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore a previously saved session on launch.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const { user: savedUser, token } = JSON.parse(raw);
          setAuthToken(token);
          setUser(savedUser);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = async (nextUser: User, token: string) => {
    setAuthToken(token);
    setUser(nextUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, token }));
  };

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      signup: async (name, email, password) => {
        const { user: newUser, token } = await api.signup(name, email, password);
        await persist(newUser, token);
      },
      login: async (email, password) => {
        const { user: loggedInUser, token } = await api.login(email, password);
        await persist(loggedInUser, token);
      },
      logout: async () => {
        try {
          await api.logout();
        } catch {
          // Token may already be invalid; clearing local state still matters.
        }
        setAuthToken(null);
        setUser(null);
        await AsyncStorage.removeItem(STORAGE_KEY);
      },
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
