import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { initializeApi } from '../utils/api';

export interface User {
  id: string;
  username: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, name: string, email?: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || '/api';

  // Token storage helpers
  const getStoredToken = useCallback(() => {
    return localStorage.getItem('auth_token');
  }, []);

  const setToken = useCallback((newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('auth_token', newToken);
      setTokenState(newToken);
      initializeApi(newToken);
    } else {
      localStorage.removeItem('auth_token');
      setTokenState(null);
      initializeApi(null);
    }
  }, []);

  // Check if token is expired
  const isTokenExpired = useCallback((token: string) => {
    try {
      const decoded = jwtDecode<{ exp: number }>(token);
      if (!decoded.exp) return false;
      return Date.now() >= decoded.exp * 1000;
    } catch {
      return true;
    }
  }, []);

  // Initialize auth from localStorage
  useEffect(() => {
    const storedToken = getStoredToken();
    if (storedToken && !isTokenExpired(storedToken)) {
      setTokenState(storedToken);
      initializeApi(storedToken);
      // Optionally fetch user data here
      fetchCurrentUser(storedToken);
    } else {
      // Token expired or doesn't exist
      localStorage.removeItem('auth_token');
      initializeApi(null);
      setIsLoading(false);
    }
  }, []);

  // Fetch current user
  const fetchCurrentUser = useCallback(
    async (authToken: string) => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser({
            id: data.id,
            username: data.username,
            role: data.role,
          });
        } else {
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    },
    [API_URL, setToken]
  );

  // Login
  const login = useCallback(
    async (username: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Login failed');
        }

        const data = await response.json();
        setToken(data.token);
        setUser(data.user);
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [API_URL, setToken]
  );

  // Register
  const register = useCallback(
    async (username: string, password: string, name: string, email?: string) => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password, name, email }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Registration failed');
        }

        const data = await response.json();
        setToken(data.token);
        setUser(data.user);
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [API_URL, setToken]
  );

  // Logout
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('selectedClubId');
  }, [setToken]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUser(data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
    }
  }, [token, API_URL, setToken, logout]);

  // Check token expiration periodically
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiry = () => {
      if (isTokenExpired(token)) {
        logout();
      }
    };

    const interval = setInterval(checkTokenExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [token, isTokenExpired, logout]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
