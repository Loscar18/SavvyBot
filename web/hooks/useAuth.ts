"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, Session, AuthState } from "../types";

// Mock user for development
const mockUser: User = {
  id: "user-1",
  email: "demo@savvybot.ai",
  name: "Usuario Demo",
  workspaceId: "workspace-1",
  role: "owner",
  emailVerified: true,
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock workspace
const mockWorkspace = {
  id: "workspace-1",
  name: "Mi Espacio de Trabajo",
  slug: "demo-workspace",
  plan: "pro",
  timezone: "Europe/Madrid",
  theme: "light",
  language: "es",
  billingEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === "development";

  // Initialize auth state
  useEffect(() => {
    const initialize = async () => {
      try {
        // In development, use mock user
        if (isDev) {
          setState({
            user: mockUser,
            session: {
              id: "session-1",
              userId: "user-1",
              token: "mock-token",
              refreshToken: "mock-refresh-token",
              expiresAt: new Date(Date.now() + 86400000),
              createdAt: new Date(),
            },
            loading: false,
            error: null,
          });
          return;
        }

        // In production, fetch from API
        const response = await fetch("/api/auth/session");
        const data = await response.json();

        if (data.user) {
          setState({
            user: data.user,
            session: data.session,
            loading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            session: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setState({
          user: null,
          session: null,
          loading: false,
          error: error instanceof Error ? error.message : "Error de autenticación",
        });
      }
    };

    initialize();
  }, [isDev]);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // In development, just return mock user
      if (isDev) {
        setState({
          user: mockUser,
          session: {
            id: "session-1",
            userId: "user-1",
            token: "mock-token",
            refreshToken: "mock-refresh-token",
            expiresAt: new Date(Date.now() + 86400000),
            createdAt: new Date(),
          },
          loading: false,
          error: null,
        });
        return;
      }

      // In production, send to API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      setState({
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Error al iniciar sesión",
      }));
      throw error;
    }
  }, [isDev]);

  // Register
  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // In development, just return mock user
      if (isDev) {
        setState({
          user: mockUser,
          session: {
            id: "session-1",
            userId: "user-1",
            token: "mock-token",
            refreshToken: "mock-refresh-token",
            expiresAt: new Date(Date.now() + 86400000),
            createdAt: new Date(),
          },
          loading: false,
          error: null,
        });
        return;
      }

      // In production, send to API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar usuario");
      }

      setState({
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Error al registrar usuario",
      }));
      throw error;
    }
  }, [isDev]);

  // Logout
  const logout = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));

      // In development, just clear state
      if (isDev) {
        setState({
          user: null,
          session: null,
          loading: false,
          error: null,
        });
        router.push("/auth/login");
        return;
      }

      // In production, send to API
      await fetch("/api/auth/logout", { method: "POST" });

      setState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      setState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
      router.push("/auth/login");
    }
  }, [isDev, router]);

  // Get workspace
  const getWorkspace = useCallback(async () => {
    // In development, return mock workspace
    if (isDev) {
      return mockWorkspace;
    }

    // In production, fetch from API
    const response = await fetch("/api/workspace");
    const data = await response.json();
    return data.workspace;
  }, [isDev]);

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    workspace: mockWorkspace,
    login,
    register,
    logout,
    getWorkspace,
  };
}
