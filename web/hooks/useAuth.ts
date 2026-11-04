"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, Session } from "../types";
import { getCurrentUser, login, logout, register, refreshSession } from "../lib/api/auth";

// Auth context type
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  clearError: () => void;
}

// Custom hook for authentication
export function useAuth(): AuthContextType {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    async function initialize() {
      try {
        const { user: currentUser, session: currentSession } = await getCurrentUser();
        setUser(currentUser);
        setSession(currentSession);
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  // Login function
  const handleLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { user: loggedInUser, session: newSession } = await login(email, password);
      setUser(loggedInUser);
      setSession(newSession);
      setLoading(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
      setLoading(false);
      return false;
    }
  }, []);

  // Register function
  const handleRegister = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { user: newUser, session: newSession } = await register(name, email, password);
      setUser(newUser);
      setSession(newSession);
      setLoading(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar");
      setLoading(false);
      return false;
    }
  }, []);

  // Logout function
  const handleLogout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await logout();
      setUser(null);
      setSession(null);
      router.push("/auth/login");
    } catch {
      // Ignore logout errors
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Refresh session function
  const handleRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const { user: refreshedUser, session: newSession } = await refreshSession();
      setUser(refreshedUser);
      setSession(newSession);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refresh: handleRefresh,
    clearError,
  };
}

// Higher-order component for auth protection
export function withAuth(Component: React.ComponentType) {
  return function ProtectedComponent(props: any) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push("/auth/login");
      }
    }, [loading, isAuthenticated, router]);

    if (loading || !isAuthenticated) {
      return null;
    }

    return <Component {...props} user={user} />;
  };
}

// Hook to check if user has specific role
export function useHasRole(requiredRole: "owner" | "admin" | "member"): boolean {
  const { user } = useAuth();

  if (!user) return false;

  const roles: Record<string, number> = {
    owner: 3,
    admin: 2,
    member: 1,
  };

  return roles[user.role] >= roles[requiredRole];
}
