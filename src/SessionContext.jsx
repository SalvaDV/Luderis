/**
 * SessionContext.jsx
 *
 * Centraliza la sesión de Supabase y elimina el prop drilling:
 *   <Component session={session} />  →  const { session } = useSession()
 *
 * También maneja:
 * - Refresh automático del token
 * - Persistencia en localStorage via authStorage
 * - Estado de carga inicial
 *
 * USO:
 *   <SessionProvider><App /></SessionProvider>
 *
 *   const { session, user, isLoading, logout } = useSession();
 */

import React, {
  createContext, useContext, useState,
  useEffect, useRef, useCallback
} from "react";
import * as sb from "../supabase.js";
import { authStorage } from "../storage.js";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => authStorage.load());
  const [isLoading, setIsLoading] = useState(false);
  const sessionRef = useRef(session);

  useEffect(() => { sessionRef.current = session; }, [session]);

  // Configurar refresh automático de token
  useEffect(() => {
    sb.setSessionRefreshCallback(async () => {
      const current = sessionRef.current;
      if (!current?.refresh_token) return null;
      try {
        const next = await sb.refreshSession(current.refresh_token);
        authStorage.save(next);
        setSession(next);
        return next;
      } catch {
        authStorage.clear();
        setSession(null);
        return null;
      }
    });
  }, []);

  const login = useCallback((s) => {
    authStorage.save(s);
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setSession(null);
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    token: session?.access_token ?? null,
    isLoading,
    isAuthenticated: !!session,
    login,
    logout,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de SessionProvider");
  return ctx;
}
