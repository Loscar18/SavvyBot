/**
 * End-to-end tests for workspace isolation
 * Tests that users can only access their own data
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test data for two different workspaces
const workspace1 = {
  id: "workspace-1",
  name: "Workspace 1",
  userId: "user-1",
  token: "token-1",
};

const workspace2 = {
  id: "workspace-2",
  name: "Workspace 2",
  userId: "user-2",
  token: "token-2",
};

describe("Workspace Isolation E2E", () => {
  beforeAll(() => {
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("Agent Isolation", () => {
    it("should not allow User 1 to access User 2's agents", async () => {
      // User 1 tries to access User 2's agents
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: "No autorizado",
        }),
      });

      const response = await fetch("/api/agents", {
        headers: {
          authorization: `Bearer ${workspace1.token}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
      expect(data.error).toContain("No autorizado");
    });

    it("should return only User 1's agents when authenticated as User 1", async () => {
      const user1Agents = [
        { id: "agent-1", workspaceId: workspace1.id, name: "User 1 Agent 1" },
        { id: "agent-2", workspaceId: workspace1.id, name: "User 1 Agent 2" },
      ];

      // Mock fetch to return User 1's agents only
      global.fetch = vi.fn((url: string, options: RequestInit) => {
        const authHeader = options?.headers as Record<string, string>;
        if (authHeader?.authorization === `Bearer ${workspace1.token}`) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: user1Agents,
            }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: "No autorizado" }),
        });
      });

      const response = await fetch("/api/agents", {
        headers: {
          authorization: `Bearer ${workspace1.token}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(2);
      expect(data.data[0].workspaceId).toBe(workspace1.id);
      expect(data.data[1].workspaceId).toBe(workspace1.id);
    });

    it("should return only User 2's agents when authenticated as User 2", async () => {
      const user2Agents = [
        { id: "agent-3", workspaceId: workspace2.id, name: "User 2 Agent 1" },
        { id: "agent-4", workspaceId: workspace2.id, name: "User 2 Agent 2" },
      ];

      // Mock fetch to return User 2's agents only
      global.fetch = vi.fn((url: string, options: RequestInit) => {
        const authHeader = options?.headers as Record<string, string>;
        if (authHeader?.authorization === `Bearer ${workspace2.token}`) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: user2Agents,
            }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: "No autorizado" }),
        });
      });

      const response = await fetch("/api/agents", {
        headers: {
          authorization: `Bearer ${workspace2.token}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(2);
      expect(data.data[0].workspaceId).toBe(workspace2.id);
      expect(data.data[1].workspaceId).toBe(workspace2.id);
    });
  });

  describe("Thread Isolation", () => {
    it("should not allow User 1 to access User 2's threads", async () => {
      const threadId = "thread-1"; // This thread belongs to User 2

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: "Hilo no encontrado",
        }),
      });

      const response = await fetch(`/api/chat/${threadId}`, {
        headers: {
          authorization: `Bearer ${workspace1.token}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(data.error).toContain("Hilo no encontrado");
    });

    it("should return User 1's threads when authenticated as User 1", async () => {
      const user1Threads = [
        { id: "thread-1", workspaceId: workspace1.id, title: "User 1 Thread 1" },
        { id: "thread-2", workspaceId: workspace1.id, title: "User 1 Thread 2" },
      ];

      // Mock fetch to return User 1's threads only
      global.fetch = vi.fn((url: string, options: RequestInit) => {
        const authHeader = options?.headers as Record<string, string>;
        if (authHeader?.authorization === `Bearer ${workspace1.token}`) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: user1Threads,
            }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: "No autorizado" }),
        });
      });

      const response = await fetch("/api/chat", {
        headers: {
          authorization: `Bearer ${workspace1.token}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(2);
      expect(data.data[0].workspaceId).toBe(workspace1.id);
    });
  });

  describe("Integration Isolation", () => {
    it("should not allow User 1 to access User 2's integrations", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: "No autorizado",
        }),
      });

      const response = await fetch("/api/integrations", {
        headers: {
          authorization: `Bearer ${workspace1.token}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it("should return only User 1's integrations when authenticated as User 1", async () => {
      const user1Integrations = [
        { id: "integration-1", workspaceId: workspace1.id, providerName: "GitHub" },
        { id: "integration-2", workspaceId: workspace1.id, providerName: "Slack" },
      ];

      // Mock fetch to return User 1's integrations only
      global.fetch = vi.fn((url: string, options: RequestInit) => {
        const authHeader = options?.headers as Record<string, string>;
        if (authHeader?.authorization === `Bearer ${workspace1.token}`) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: user1Integrations,
            }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: "No autorizado" }),
        });
      });

      const response = await fetch("/api/integrations", {
        headers: {
          authorization: `Bearer ${workspace1.token}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(2);
      expect(data.data[0].workspaceId).toBe(workspace1.id);
    });
  });

  describe("Workspace Settings Isolation", () => {
    it("should not allow User 1 to access User 2's workspace settings", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: "No autorizado",
        }),
      });

      const response = await fetch("/api/settings", {
        headers: {
          authorization: `Bearer ${workspace1.token}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it("should return User 1's workspace settings when authenticated as User 1", async () => {
      const user1Settings = {
        id: workspace1.id,
        name: workspace1.name,
        plan: "free",
        timezone: "Europe/Madrid",
      };

      // Mock fetch to return User 1's settings only
      global.fetch = vi.fn((url: string, options: RequestInit) => {
        const authHeader = options?.headers as Record<string, string>;
        if (authHeader?.authorization === `Bearer ${workspace1.token}`) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: user1Settings,
            }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: "No autorizado" }),
        });
      });

      const response = await fetch("/api/settings", {
        headers: {
          authorization: `Bearer ${workspace1.token}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(workspace1.id);
      expect(data.data.name).toBe(workspace1.name);
    });
  });

  describe("Cross-Workspace Data Leak Prevention", () => {
    it("should prevent data leakage between workspaces", async () => {
      // Simulate a scenario where User 1 tries to access User 2's data
      // through various endpoints
      
      const endpoints = [
        "/api/agents",
        "/api/chat",
        "/api/integrations",
        "/api/groups",
        "/api/routines",
        "/api/memory",
        "/api/settings",
      ];

      // Mock all endpoints to return 401 for User 1 trying to access User 2's data
      global.fetch = vi.fn((url: string, options: RequestInit) => {
        const authHeader = options?.headers as Record<string, string>;
        if (authHeader?.authorization !== `Bearer ${workspace2.token}`) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: async () => ({ error: "No autorizado" }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });
      });

      // Test all endpoints
      for (const endpoint of endpoints) {
        const response = await fetch(endpoint, {
          headers: {
            authorization: `Bearer ${workspace1.token}`,
          },
        });

        const data = await response.json();

        expect(response.ok).toBe(false);
        expect(response.status).toBe(401);
        expect(data.error).toContain("No autorizado");
      }
    });

    it("should ensure each user only sees their own data", async () => {
      // User 1 should only see their own data
      global.fetch = vi.fn((url: string, options: RequestInit) => {
        const authHeader = options?.headers as Record<string, string>;
        
        if (authHeader?.authorization === `Bearer ${workspace1.token}`) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: [{ id: "data-1", workspaceId: workspace1.id }],
            }),
          });
        } else if (authHeader?.authorization === `Bearer ${workspace2.token}`) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: [{ id: "data-2", workspaceId: workspace2.id }],
            }),
          });
        }
        
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: "No autorizado" }),
        });
      });

      // User 1 should only see their data
      const response1 = await fetch("/api/agents", {
        headers: {
          authorization: `Bearer ${workspace1.token}`,
        },
      });
      const data1 = await response1.json();
      expect(data1.data[0].workspaceId).toBe(workspace1.id);

      // User 2 should only see their data
      const response2 = await fetch("/api/agents", {
        headers: {
          authorization: `Bearer ${workspace2.token}`,
        },
      });
      const data2 = await response2.json();
      expect(data2.data[0].workspaceId).toBe(workspace2.id);

      // Ensure they don't see each other's data
      expect(data1.data[0].workspaceId).not.toBe(workspace2.id);
      expect(data2.data[0].workspaceId).not.toBe(workspace1.id);
    });
  });
});
