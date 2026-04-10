import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import api from "../api/axios";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshUser: (tokenOverride?: string | null) => Promise<void>;
};

const AUTH_STORAGE_KEY = "portfolio_auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredAuth = () => {
  const fallbackToken = localStorage.getItem("token");
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!stored) {
    return { token: fallbackToken, user: null };
  }

  try {
    const parsed = JSON.parse(stored) as { token: string | null; user: AuthUser | null };
    return { token: parsed.token || fallbackToken, user: parsed.user };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return { token: fallbackToken, user: null };
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistAuth = (nextToken: string | null, nextUser: AuthUser | null) => {
    setToken(nextToken);
    setUser(nextUser);

    if (!nextToken || !nextUser) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem("token");
      return;
    }

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ token: nextToken, user: nextUser }),
    );
    localStorage.setItem("token", nextToken);
  };

  const logout = () => {
    persistAuth(null, null);
  };

  const refreshUser = async (tokenOverride?: string | null) => {
    const storedAuth = readStoredAuth();
    const activeToken = tokenOverride || storedAuth.token;

    if (!activeToken) {
      logout();
      return;
    }

    try {
      const { data } = await api.get("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      persistAuth(activeToken, data.user);
    } catch {
      logout();
    }
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedAuth = readStoredAuth();

      if (!storedAuth.token) {
        setIsLoading(false);
        return;
      }

      setToken(storedAuth.token);
      setUser(storedAuth.user);

      await refreshUser(storedAuth.token);
      setIsLoading(false);
    };

    void bootstrapAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login: persistAuth,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
