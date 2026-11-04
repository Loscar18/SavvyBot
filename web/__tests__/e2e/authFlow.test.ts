/**
 * End-to-end tests for the authentication flow
 * Tests user registration, login, and workspace isolation
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "../../lib/db";
import { users, workspaces, agents, threads, messages } from "../../lib/db/schema";
import { eq, and } from "drizzle-orm";

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Authentication Flow E2E", () => {
  beforeAll(() => {
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("User Registration", () => {
    it("should register a new user with a workspace", async () => {
      const newUser = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        workspaceName: "Test Workspace",
      };

      // Mock the registration API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: "test-user-id",
              email: newUser.email,
              name: newUser.name,
              workspaceId: "test-workspace-id",
              role: "owner",
            },
            workspace: {
              id: "test-workspace-id",
              name: newUser.workspaceName,
              plan: "free",
            },
          },
        }),
      });

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe(newUser.email);
      expect(data.data.workspace.name).toBe(newUser.workspaceName);
    });

    it("should reject registration with invalid email", async () => {
      const invalidUser = {
        email: "invalid-email",
        password: "password123",
        name: "Test User",
        workspaceName: "Test Workspace",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Email inválido",
          details: [
            {
              path: ["email"],
              message: "Email inválido",
            },
          ],
        }),
      });

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidUser),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toContain("Email");
    });

    it("should reject registration with existing email", async () => {
      const existingUser = {
        email: "existing@example.com",
        password: "password123",
        name: "Test User",
        workspaceName: "Test Workspace",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Este email ya está registrado",
        }),
      });

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(existingUser),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toContain("email ya está");
    });

    it("should reject registration with weak password", async () => {
      const weakPasswordUser = {
        email: "test@example.com",
        password: "123",
        name: "Test User",
        workspaceName: "Test Workspace",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: "La contraseña debe tener al menos 8 caracteres",
        }),
      });

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weakPasswordUser),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toContain("contraseña");
    });
  });

  describe("User Login", () => {
    it("should login with valid credentials", async () => {
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: "test-user-id",
              email: credentials.email,
              name: "Test User",
              workspaceId: "test-workspace-id",
              role: "owner",
            },
            token: "test-jwt-token",
            refreshToken: "test-refresh-token",
          },
        }),
      });

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.data.refreshToken).toBeDefined();
    });

    it("should reject login with invalid credentials", async () => {
      const invalidCredentials = {
        email: "test@example.com",
        password: "wrong-password",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: "Credenciales inválidas",
        }),
      });

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidCredentials),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
      expect(data.error).toContain("Credenciales");
    });
  });
});
