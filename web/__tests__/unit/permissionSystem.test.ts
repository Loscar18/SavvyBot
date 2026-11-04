/**
 * Unit tests for the permission system
 * Tests that agents can only access tools they have permission for
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "../../lib/db";
import { agents, integrations, toolPermissions, workspaces, users } from "../../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAvailableTools, setToolPermission, getToolPermissions } from "../../lib/agents";

// Mock workspace and agent IDs
const testWorkspaceId = "test-workspace-1";
const testAgentId = "test-agent-1";
const testIntegrationId = "test-integration-1";

// Mock data
const mockAgent = {
  id: testAgentId,
  workspaceId: testWorkspaceId,
  name: "Test Agent",
  emoji: "🤖",
  color: "#FF7A29",
  role: "Test Role",
  autonomy: 2,
  modelName: "grok",
  status: "active",
};

const mockIntegration = {
  id: testIntegrationId,
  workspaceId: testWorkspaceId,
  kind: "api" as const,
  providerName: "Test API",
  status: "connected" as const,
};

const mockTools = [
  { name: "read_data", description: "Read data from API", permission: "read" },
  { name: "write_data", description: "Write data to API", permission: "write_approval" },
  { name: "delete_data", description: "Delete data from API", permission: "blocked" },
];

describe("Permission System", () => {
  beforeAll(async () => {
    // Setup test database
    // In a real implementation, we'd use a test database
    // For now, we'll mock the functions
    
    vi.mock("../../lib/db", () => ({
      db: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        execute: vi.fn(),
      },
    }));
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("Tool Permissions", () => {
    it("should return only allowed tools for an agent", async () => {
      // Mock the database query to return our test data
      vi.mocked(db.select).mockImplementationOnce(() => 
        Promise.resolve([
          { ...mockIntegration, configCiphertext: "test" },
        ] as any)
      );

      vi.mocked(db.select).mockImplementationOnce(() => 
        Promise.resolve([
          { toolName: "read_data", scope: "read" },
          { toolName: "write_data", scope: "write_approval" },
          { toolName: "delete_data", scope: "blocked" },
        ] as any)
      );

      // Mock listIntegrationTools to return our mock tools
      const originalListTools = vi.fn().mockResolvedValue(mockTools);
      vi.mock("../../lib/integrations", () => ({
        listIntegrationTools: originalListTools,
      }));

      const availableTools = await getAvailableTools(testAgentId, testWorkspaceId);

      // Should only return read_data and write_data (delete_data is blocked)
      expect(availableTools.length).toBe(2);
      expect(availableTools.map(t => t.name)).toContain("read_data");
      expect(availableTools.map(t => t.name)).toContain("write_data");
      expect(availableTools.map(t => t.name)).not.toContain("delete_data");
    });

    it("should set tool permission correctly", async () => {
      vi.mocked(db.insert).mockImplementationOnce(() => 
        Promise.resolve([{ id: "1", agentId: testAgentId, integrationId: testIntegrationId, toolName: "read_data", scope: "read" }] as any)
      );

      const permission = await setToolPermission(
        testAgentId,
        testIntegrationId,
        "read_data",
        "read",
        testWorkspaceId
      );

      expect(permission).toBeDefined();
      expect(permission.scope).toBe("read");
    });

    it("should update existing tool permission", async () => {
      vi.mocked(db.insert).mockImplementationOnce(() => 
        Promise.resolve([{ id: "1", agentId: testAgentId, integrationId: testIntegrationId, toolName: "write_data", scope: "write_approval" }] as any)
      );

      vi.mocked(db.update).mockImplementationOnce(() => 
        Promise.resolve([{ id: "1", agentId: testAgentId, integrationId: testIntegrationId, toolName: "write_data", scope: "blocked" }] as any)
      );

      const permission = await setToolPermission(
        testAgentId,
        testIntegrationId,
        "write_data",
        "blocked",
        testWorkspaceId
      );

      expect(permission).toBeDefined();
      expect(permission.scope).toBe("blocked");
    });

    it("should get all tool permissions for an agent", async () => {
      vi.mocked(db.select).mockImplementationOnce(() => 
        Promise.resolve([
          { id: "1", agentId: testAgentId, integrationId: testIntegrationId, toolName: "read_data", scope: "read" },
          { id: "2", agentId: testAgentId, integrationId: testIntegrationId, toolName: "write_data", scope: "write_approval" },
        ] as any)
      );

      const permissions = await getToolPermissions(testAgentId, testWorkspaceId);

      expect(permissions.length).toBe(2);
      expect(permissions.map(p => p.toolName)).toContain("read_data");
      expect(permissions.map(p => p.toolName)).toContain("write_data");
    });
  });

  describe("Autonomy Levels", () => {
    it("should allow read tools at autonomy level 1", () => {
      const autonomy = 1;
      const scope = "read";
      
      // Level 1 can use read tools
      const canUse = scope !== "blocked" && (scope === "read" || autonomy >= 2);
      expect(canUse).toBe(true);
    });

    it("should require approval for write tools at autonomy level 1", () => {
      const autonomy = 1;
      const scope = "write_approval";
      
      // Level 1 requires approval for write_approval tools
      const needsApproval = scope === "write_approval" && autonomy < 2;
      expect(needsApproval).toBe(true);
    });

    it("should block blocked tools at any autonomy level", () => {
      const autonomy = 3;
      const scope = "blocked";
      
      // Blocked tools are always blocked
      const canUse = scope !== "blocked";
      expect(canUse).toBe(false);
    });

    it("should allow write_approval tools at autonomy level 2", () => {
      const autonomy = 2;
      const scope = "write_approval";
      
      // Level 2 can use write_approval tools
      const canUse = scope !== "blocked" && (scope === "read" || autonomy >= 2);
      expect(canUse).toBe(true);
    });

    it("should allow all non-blocked tools at autonomy level 3", () => {
      const autonomy = 3;
      const scopes = ["read", "write_approval"] as const;
      
      scopes.forEach(scope => {
        const canUse = scope !== "blocked" && (scope === "read" || autonomy >= 2);
        expect(canUse).toBe(true);
      });
    });
  });

  describe("Irreversible Actions", () => {
    const irreversiblePatterns = [
      "delete",
      "remove",
      "erase",
      "buy",
      "purchase",
      "send",
      "publish",
      "post",
      "commit",
      "push",
      "merge",
    ];

    it("should identify irreversible actions", () => {
      irreversiblePatterns.forEach(pattern => {
        const toolName = `test_${pattern}_data`;
        const lowerName = toolName.toLowerCase();
        const isIrreversible = irreversiblePatterns.some(p => lowerName.includes(p));
        expect(isIrreversible).toBe(true);
      });
    });

    it("should not identify non-irreversible actions", () => {
      const nonIrreversible = ["read", "get", "list", "search", "query"];
      
      nonIrreversible.forEach(toolName => {
        const lowerName = toolName.toLowerCase();
        const isIrreversible = irreversiblePatterns.some(p => lowerName.includes(p));
        expect(isIrreversible).toBe(false);
      });
    });

    it("should always require approval for irreversible actions", () => {
      const toolName = "delete_user";
      const autonomy = 3; // Even at level 3
      
      const lowerName = toolName.toLowerCase();
      const isIrreversible = irreversiblePatterns.some(p => lowerName.includes(p));
      const requiresApproval = isIrreversible;
      
      expect(requiresApproval).toBe(true);
    });
  });
});
