import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/context/auth-context";
import * as authService from "@/services/authService";
import {
  STORAGE_KEY,
  SESSION_EXPIRED_EVENT,
  buildSession,
  clearSession,
  readSession,
  saveSession,
} from "@/lib/session";
import { hasAnyRole } from "@/lib/roles";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());
  const [sessionMessage, setSessionMessage] = useState(null);

  const logout = useCallback((message = null) => {
    clearSession();
    setSession(null);
    setSessionMessage(typeof message === "string" ? message : null);
  }, []);

  // Cierre automático al llegar el "exp" del JWT
  useEffect(() => {
    if (!session) return undefined;
    const ms = Math.max(session.expiresAt - Date.now(), 0);
    const timer = setTimeout(() => logout("Tu sesión expiró. Inicia sesión nuevamente."), ms);
    return () => clearTimeout(timer);
  }, [session, logout]);

  // Sesión invalidada por el authorizer (401) y cierre de sesión en otras pestañas
  useEffect(() => {
    const onExpired = (e) => logout(e.detail?.message || "Tu sesión expiró. Inicia sesión nuevamente.");
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && !e.newValue) setSession(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
      window.removeEventListener("storage", onStorage);
    };
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    const next = buildSession(data.token, data.user);
    saveSession(data.token);
    setSession(next);
    setSessionMessage(null);
    return next.user;
  }, []);

  const register = useCallback((payload) => authService.register(payload), []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      expiresAt: session?.expiresAt ?? null,
      isAuthenticated: !!session,
      sessionMessage,
      login,
      register,
      logout,
      hasRole: (...roles) => hasAnyRole(session?.user, roles),
    }),
    [session, sessionMessage, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
