"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminApiError, adminLogin as apiAdminLogin } from "@/lib/auth/admin-api";
import { clearAdminSession, getAdminToken, getAdminUsername, saveAdminSession } from "@/lib/auth/admin-session";

type AdminAuthStatus = "loading" | "authorized" | "unauthorized";

interface AdminAuthContextValue {
  status: AdminAuthStatus;
  username: string | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

/** Session-scoped admin auth for /admin routes. */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AdminAuthStatus>("loading");
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = getAdminToken();
    const storedUser = getAdminUsername();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUsername(storedUser);
      setStatus("authorized");
    } else {
      setStatus("unauthorized");
    }
  }, []);

  const login = useCallback(async (user: string, password: string) => {
    const result = await apiAdminLogin(user, password);
    saveAdminSession(result.adminToken, result.username);
    setToken(result.adminToken);
    setUsername(result.username);
    setStatus("authorized");
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
    setToken(null);
    setUsername(null);
    setStatus("unauthorized");
  }, []);

  const value = useMemo(
    () => ({ status, username, token, login, logout }),
    [status, username, token, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export { AdminApiError };
