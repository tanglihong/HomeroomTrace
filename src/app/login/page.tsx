"use client";

import { LoginView } from "@/features/auth/login-view";

/** Standalone login route (primary gate is AuthGate in app-shell). */
export default function LoginPage() {
  return <LoginView />;
}
