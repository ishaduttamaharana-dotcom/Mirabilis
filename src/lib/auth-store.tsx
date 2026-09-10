import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { api, ApiClientError, setAccessToken } from "./api-client";

export type AdminRole = "super_admin" | "editor" | "viewer";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  mustChangePassword: boolean;
  active: boolean;
}

interface LoginResponse {
  accessToken: string;
  user: AdminUser;
}

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AdminUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("idle");

  const login = useCallback(async (email: string, password: string) => {
    setStatus("loading");
    try {
      const res = await api.post<LoginResponse>("/auth/login", { email, password });
      setAccessToken(res.accessToken);
      setUser(res.user);
      setStatus("authenticated");
      return res.user;
    } catch (err) {
      setStatus("unauthenticated");
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const bootstrap = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await api.post<{ accessToken: string }>("/auth/refresh");
      setAccessToken(res.accessToken);
      try {
        const me = await api.get<AdminUser>("/auth/me");
        setUser(me);
      } catch {
        // user object is optional for session gating
      }
      setStatus("authenticated");
    } catch (err) {
      if (err instanceof ApiClientError && err.status !== 401) {
        console.error("Session bootstrap failed", err);
      }
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout, bootstrap }),
    [user, status, login, logout, bootstrap],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
