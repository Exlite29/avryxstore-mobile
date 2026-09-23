import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { authService, LoginResult } from '@/lib/services/authService';
import { setToken, getToken, clearStoredToken, setUnauthorizedHandler, isApiError } from '@/lib/api';
import { User } from '@/lib/types';

const USER_KEY = 'avryx:user';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handleUnauthorized = useCallback(async () => {
    await clearStoredToken();
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void handleUnauthorized();
    });
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const savedUser = await AsyncStorage.getItem(USER_KEY);
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        try {
          const profile = await authService.getProfile();
          setUser(profile);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
        } catch (error) {
          if (isApiError(error) && error.statusCode === 401) {
            await handleUnauthorized();
          }
        }
      } catch {
        // Fall through to logged-out state.
      } finally {
        setLoading(false);
      }
    })();
  }, [handleUnauthorized]);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    const result: LoginResult = await authService.login(credentials);
    await setToken(result.token ?? null);
    setUser(result.user);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(result.user));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    await clearStoredToken();
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      refreshProfile,
    }),
    [user, loading, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}