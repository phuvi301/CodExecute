import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  UserProfile,
  loginApi,
  registerApi,
  getMeApi,
  updateProfileApi,
  uploadAvatarApi,
} from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<UserProfile>;
  uploadAvatar: (file: File) => Promise<{ message: string; avatar_url: string; user: UserProfile }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'codexecute_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        setUser(null);
        return;
      }
      try {
        const profile = await getMeApi(token);
        setUser(profile);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await loginApi(payload);
      localStorage.setItem(TOKEN_KEY, res.access_token);
      setToken(res.access_token);

      const profile = await getMeApi(res.access_token);
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      await registerApi(payload);
      // Auto login after registration
      await login({ email: payload.email, password: payload.password });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    if (!token) throw new Error('Not authenticated');
    const updated = await updateProfileApi(token, payload);
    setUser(updated);
    return updated;
  };

  const uploadAvatar = async (file: File): Promise<{ message: string; avatar_url: string; user: UserProfile }> => {
    if (!token) throw new Error('Not authenticated');
    const res = await uploadAvatarApi(token, file);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        updateProfile,
        uploadAvatar,
        logout,
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

