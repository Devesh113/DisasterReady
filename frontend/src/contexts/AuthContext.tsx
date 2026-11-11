'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginCredentials, RegisterCredentials } from '@/types/auth';
import authService from '@/services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const handleRoleRedirect = useCallback(
    (role: string) => {
      switch (role) {
        case 'AUTHORITY':
          router.push('/authority/dashboard');
          break;
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'CITIZEN':
        default:
          router.push('/citizen/dashboard');
          break;
      }
    },
    [router]
  );

  // Restore session on initial application mount
  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('disaster_ready_token') : null;

      if (storedToken) {
        setToken(storedToken);
        try {
          const profile = await authService.getMe();
          setUser(profile);
          if (typeof window !== 'undefined') {
            localStorage.setItem('disaster_ready_user', JSON.stringify(profile));
          }
        } catch (meErr) {
          // Access token might be expired; attempt refresh rotation via HttpOnly cookie
          try {
            const refreshData = await authService.refreshToken();
            setToken(refreshData.token);
            setUser(refreshData.user);
            if (typeof window !== 'undefined') {
              localStorage.setItem('disaster_ready_token', refreshData.token);
              localStorage.setItem('disaster_ready_user', JSON.stringify(refreshData.user));
            }
          } catch {
            // Both access token and refresh token invalid; clear storage
            setToken(null);
            setUser(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('disaster_ready_token');
              localStorage.removeItem('disaster_ready_user');
            }
          }
        }
      } else {
        // Even without localStorage access token, check if valid HttpOnly cookie exists
        try {
          const refreshData = await authService.refreshToken();
          setToken(refreshData.token);
          setUser(refreshData.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('disaster_ready_token', refreshData.token);
            localStorage.setItem('disaster_ready_user', JSON.stringify(refreshData.user));
          }
        } catch {
          // No active session
          setToken(null);
          setUser(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    // Listen for global auth expiration events from apiClient response interceptor
    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
      router.push('/login?expired=true');
    };

    window.addEventListener('disaster_ready_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('disaster_ready_auth_expired', handleAuthExpired);
    };
  }, [restoreSession, router]);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await authService.login(credentials);
      setToken(data.token);
      setUser(data.user);

      if (typeof window !== 'undefined') {
        localStorage.setItem('disaster_ready_token', data.token);
        localStorage.setItem('disaster_ready_user', JSON.stringify(data.user));
      }

      handleRoleRedirect(data.user.role);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      // Security: Public registration must never assign ADMIN or AUTHORITY roles
      const data = await authService.register({
        ...credentials,
        role: 'CITIZEN',
      });

      setToken(data.token);
      setUser(data.user);

      if (typeof window !== 'undefined') {
        localStorage.setItem('disaster_ready_token', data.token);
        localStorage.setItem('disaster_ready_user', JSON.stringify(data.user));
      }

      router.push('/citizen/dashboard');
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setToken(null);
      setUser(null);
      setIsLoading(false);
      router.push('/login');
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const profile = await authService.getMe();
      setUser(profile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('disaster_ready_user', JSON.stringify(profile));
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
