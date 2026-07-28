"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { login as apiLogin } from "@/lib/auth/auth-api";
import { getOrCreateDeviceId } from "@/lib/auth/device-id";
import { clearLicense, getLicense, getLicenseMeta, saveLicense } from "@/lib/auth/license-store";
import { validateLicense } from "@/lib/auth/license-validator";
import { startSessionGuard, verifyServerSession } from "@/lib/auth/session-guard";

export type AuthStatus = "loading" | "authorized" | "unauthorized";

interface AuthContextValue {
  status: AuthStatus;
  username: string | null;
  displayName: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Provides offline License auth state for the app shell gate. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const license = await getLicense();
      const meta = await getLicenseMeta();
      const deviceId = await getOrCreateDeviceId();

      if (!license) {
        if (!cancelled) setStatus("unauthorized");
        return;
      }

      const payload = await validateLicense(license, deviceId);
      if (cancelled) return;

      if (payload) {
        const serverOk = await verifyServerSession(license);
        if (cancelled) return;
        if (!serverOk) {
          await clearLicense();
          setUsername(null);
          setDisplayName(null);
          setStatus("unauthorized");
          return;
        }
        setUsername(meta?.username ?? payload.username);
        setDisplayName(meta?.displayName ?? meta?.username ?? payload.username);
        setStatus("authorized");
      } else {
        await clearLicense();
        setUsername(null);
        setDisplayName(null);
        setStatus("unauthorized");
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (user: string, password: string) => {
    const deviceId = await getOrCreateDeviceId();
    const result = await apiLogin(user, password, deviceId);
    await saveLicense(result.license, {
      username: result.username,
      displayName: result.displayName,
    });
    setUsername(result.username);
    setDisplayName(result.displayName ?? result.username);
    setStatus("authorized");
  }, []);

  const logout = useCallback(() => {
    void clearLicense();
    setUsername(null);
    setDisplayName(null);
    setStatus("unauthorized");
  }, []);

  useEffect(() => {
    if (status !== "authorized") return;
    return startSessionGuard(logout);
  }, [status, logout]);

  const value = useMemo(
    () => ({ status, username, displayName, login, logout }),
    [status, username, displayName, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Reads auth state; must be used within AuthProvider. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
