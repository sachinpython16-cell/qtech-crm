import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  User,
  LoginCredentials,
  RegisterCredentials,
} from '../types/auth';
import {
  loginApi,
  registerApi,
  getMeApi,
  logoutApi,
  tokenStorage,
} from '../services/authApi';
import { storage } from '../services/storage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const profile = await getMeApi();
      setUser(profile);
    } catch {
      setUser(null);
      tokenStorage.clearTokens();
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = tokenStorage.getAccessToken();
      const refreshToken = tokenStorage.getRefreshToken();

      if (accessToken || refreshToken) {
        await fetchProfile();
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    await loginApi(credentials);
    const profile = await getMeApi();
    setUser(profile);
  };

  const register = async (credentials: RegisterCredentials) => {
    await registerApi(credentials);
    // After successful registration, log user in directly
    await login({
      identifier: credentials.username || credentials.email,
      password: credentials.password,
    });
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
      tokenStorage.clearTokens();
      storage.resetAll();
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
