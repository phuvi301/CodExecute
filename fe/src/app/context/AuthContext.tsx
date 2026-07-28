import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  UserProfile,
  loginApi,
  registerApi,
  refreshApi,
  logoutApi,
  getProfileApi,
  updateProfileApi,
  uploadAvatarApi,
  getAccessToken,
  setAccessToken,
  clearAccessToken,
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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return parsed.sub || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getAccessToken());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper đồng bộ token vào runtime memory
  const updateRuntimeToken = (newToken: string | null) => {
    setAccessToken(newToken);
    setTokenState(newToken);
  };

  useEffect(() => {
    async function initAuth() {
      try {
        // Tự động khôi phục phiên bằng HTTP-only refreshToken cookie khi load lại trang
        const authRes = await refreshApi();
        updateRuntimeToken(authRes.access_token);

        const userId = parseUserIdFromToken(authRes.access_token);
        if (userId) {
          const profile = await getProfileApi(userId);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch {
        // Không có cookie refreshToken hợp lệ -> Chuyển về trạng thái guest
        clearAccessToken();
        setTokenState(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const res = await loginApi(payload);
      updateRuntimeToken(res.access_token);

      const userId = parseUserIdFromToken(res.access_token);
      if (userId) {
        const profile = await getProfileApi(userId);
        setUser(profile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      await registerApi(payload);
      // Tự động đăng nhập sau khi đăng ký
      await login({ email: payload.email, password: payload.password });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const currentToken = getAccessToken();
    if (!currentToken) throw new Error('Not authenticated');
    const updated = await updateProfileApi(currentToken, payload);
    setUser(updated);
    return updated;
  };

  const uploadAvatar = async (file: File): Promise<{ message: string; avatar_url: string; user: UserProfile }> => {
    const currentToken = getAccessToken();
    if (!currentToken) throw new Error('Not authenticated');
    const res = await uploadAvatarApi(currentToken, file);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    await logoutApi();
    updateRuntimeToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: getAccessToken(),
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
