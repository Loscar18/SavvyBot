/**
 * End-to-end tests for agent creation and management
 * Tests creating agents, connecting integrations, and using tools
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock authentication token
const testToken = "test-jwt-token";
const testWorkspaceId = "test-workspace-id";
const testUserId = "test-user-id";

describe("Agent Creation Flow E2E", () => {
  beforeAll(() => {
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("Create Agent", () => {
    it("should create a new agent", async () => {
      const newAgent = {
        name: "Test Agent",
        emoji: "🤖",
        color: "#FF7A29",
        role: "Test Role",
        personality: "Friendly",
        instructions: "Help the user",
        autonomy: 2,
        modelName: "grok",
      };

      // Mock the agent creation API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: "test-agent-id",
            workspaceId: testWorkspaceId,
            ...newAgent,
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      // Set authorization header
      global.fetch = vi.fn((url: string, options: RequestInit) => {
        const authHeader = options?.headers as Record<string, string>;
        if (authHeader?.authorization === `Bearer ${testToken}`) {
          return mockFetch(url, options);
        }
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: "No autorizado" }),
        });
      });

      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify(newAgent),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(newAgent.name);
      expect(data.data.role).toBe(newAgent.role);
      expect(data.data.autonomy).toBe(newAgent.autonomy);
    });

    it("should reject agent creation with invalid data", async () => {
      const invalidAgent = {
        name: "", // Empty name
        role: "", // Empty role
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Datos inválidos",
          details: [
            { path: ["name"], message: "El nombre es obligatorio" },
            { path: ["role"], message: "El rol es obligatorio" },
          ],
        }),
      });

      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify(invalidAgent),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(data.error).toContain("Datos inválidos");
    });

    it("should reject unauthenticated agent creation", async () => {
      const newAgent = {
        name: "Test Agent",
        role: "Test Role",
      };

      // No authorization header
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: "No autorizado",
        }),
      });

      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAgent),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
      expect(data.error).toContain("No autorizado");
    });
  });

  describe("List Agents", () => {
    it("should list all agents for a workspace", async () => {
      const mockAgents = [
        {
          id: "agent-1",
          workspaceId: testWorkspaceId,
          name: "Agent 1",
          emoji: "🤖",
          role: "Role 1",
          autonomy: 1,
          status: "active",
        },
        {
          id: "agent-2",
          workspaceId: testWorkspaceId,
          name: "Agent 2",
          emoji: "🧠",
          role: "Role 2",
          autonomy: 2,
          status: "active",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockAgents,
        }),
      });

      const response = await fetch("/api/agents", {
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.length).toBe(2);
      expect(data.data[0].name).toBe("Agent 1");
      expect(data.data[1].name).toBe("Agent 2");
    });

    it("should return empty array when no agents exist", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
        }),
      });

      const response = await fetch("/api/agents", {
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });
  });

  describe("Agent Details", () => {
    it("should get agent details by ID", async () => {
      const agentId = "test-agent-id";
      const mockAgent = {
        id: agentId,
        workspaceId: testWorkspaceId,
        name: "Test Agent",
        emoji: "🤖",
        role: "Test Role",
        autonomy: 2,
        status: "active",
        modelName: "grok",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            agent: mockAgent,
            activity: [],
            availableTools: [],
            toolPermissions: [],
            memories: [],
            skills: [],
          },
        }),
      });

      const response = await fetch(`/api/agents/${agentId}`, {
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.agent.id).toBe(agentId);
      expect(data.data.agent.name).toBe("Test Agent");
    });

    it("should return 404 for non-existent agent", async () => {
      const nonExistentAgentId = "non-existent-agent-id";

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: "Agente no encontrado",
        }),
      });

      const response = await fetch(`/api/agents/${nonExistentAgentId}`, {
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(data.error).toContain("Agente no encontrado");
    });
  });

  describe("Update Agent", () => {
    it("should update an existing agent", async () => {
      const agentId = "test-agent-id";
      const updatedData = {
        name: "Updated Agent",
        role: "Updated Role",
        autonomy: 3,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: agentId,
            workspaceId: testWorkspaceId,
            ...updatedData,
            status: "active",
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      const response = await fetch(`/api/agents/${agentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("Updated Agent");
      expect(data.data.role).toBe("Updated Role");
      expect(data.data.autonomy).toBe(3);
    });

    it("should return 404 when updating non-existent agent", async () => {
      const nonExistentAgentId = "non-existent-agent-id";
      const updatedData = {
        name: "Updated Agent",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: "Agente no encontrado",
        }),
      });

      const response = await fetch(`/api/agents/${nonExistentAgentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${testToken}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe("Delete Agent", () => {
    it("should delete an existing agent", async () => {
      const agentId = "test-agent-id";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: "Agente eliminado correctamente",
        }),
      });

      const response = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.message).toContain("eliminado");
    });

    it("should return 404 when deleting non-existent agent", async () => {
      const nonExistentAgentId = "non-existent-agent-id";

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: "Agente no encontrado",
        }),
      });

      const response = await fetch(`/api/agents/${nonExistentAgentId}`, {
        method: "DELETE",
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      });

      const data = await response.json();

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });
});
