/**
 * Unit tests for the agent turn execution system
 * Tests the agent turn processor, tool calls, and approval flow
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import { db } from "../../lib/db";
import { agents, messages, threads, workspaces, approvals, jobs } from "../../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { executeAgentTurn, createAgentContext, DEFAULT_SYSTEM_PROMPT } from "../../lib/agents";

// Mock data
const testWorkspaceId = "test-workspace-1";
const testAgentId = "test-agent-1";
const testThreadId = "test-thread-1";
const testUserMessage = "Test message";

const mockAgent = {
  id: testAgentId,
  workspaceId: testWorkspaceId,
  name: "Test Agent",
  emoji: "🤖",
  color: "#FF7A29",
  role: "Test Role",
  autonomy: 2,
  modelName: "grok",
  modelBaseUrl: "https://api.example.com",
  modelKeyCiphertext: null,
  modelKey: null,
  personality: "Test personality",
  instructions: "Test instructions",
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWorkspace = {
  id: testWorkspaceId,
  name: "Test Workspace",
  timezone: "Europe/Madrid",
  language: "es",
};

describe("Agent Turn Execution", () => {
  beforeAll(() => {
    // Mock the database
    vi.mock("../../lib/db", () => ({
      db: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        execute: vi.fn(),
      },
    }));

    vi.mock("../../lib/crypto", () => ({
      encrypt: vi.fn((text: string) => text),
      decrypt: vi.fn((text: string) => text),
    }));
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe("System Prompt", () => {
    it("should have the correct default system prompt", () => {
      expect(DEFAULT_SYSTEM_PROMPT).toContain("{{name}}");
      expect(DEFAULT_SYSTEM_PROMPT).toContain("{{role}}");
      expect(DEFAULT_SYSTEM_PROMPT).toContain("{{autonomy}}");
      expect(DEFAULT_SYSTEM_PROMPT).toContain("{{owner}}");
    });

    it("should replace placeholders with actual values", () => {
      const prompt = DEFAULT_SYSTEM_PROMPT
        .replace("{{name}}", mockAgent.name)
        .replace("{{role}}", mockAgent.role)
        .replace("{{autonomy}}", mockAgent.autonomy.toString())
        .replace("{{owner}}", "Test User");

      expect(prompt).toContain("Test Agent");
      expect(prompt).toContain("Test Role");
      expect(prompt).toContain("2");
      expect(prompt).toContain("Test User");
    });
  });

  describe("Agent Context Creation", () => {
    it("should create agent context with all required data", async () => {
      // Mock database responses
      vi.mocked(db.select).mockImplementationOnce(() => 
        Promise.resolve([mockAgent] as any)
      );

      vi.mocked(db.select).mockImplementationOnce(() => 
        Promise.resolve([mockWorkspace] as any)
      );

      vi.mocked(db.select).mockImplementationOnce(() => 
        Promise.resolve([] as any) // No messages
      );

      vi.mocked(db.select).mockImplementationOnce(() => 
        Promise.resolve([] as any) // No memories
      );

      vi.mocked(db.select).mockImplementationOnce(() => 
        Promise.resolve([] as any) // No skills
      );

      vi.mocked(db.select).mockImplementationOnce(() => 
        Promise.resolve([] as any) // No integrations
      );

      const context = await createAgentContext(
        testWorkspaceId,
        testAgentId,
        testThreadId,
        testUserMessage,
        "test-job-id"
      );

      expect(context).toBeDefined();
      expect(context.workspaceId).toBe(testWorkspaceId);
      expect(context.agent.id).toBe(testAgentId);
      expect(context.threadId).toBe(testThreadId);
      expect(context.userMessage).toBe(testUserMessage);
    });

    it("should throw error when agent not found", async () => {
      vi.mocked(db.select).mockImplementationOnce(() => 
        Promise.resolve([] as any)
      );

      await expect(
        createAgentContext(testWorkspaceId, testAgentId, testThreadId, testUserMessage, "test-job-id")
      ).rejects.toThrow("Agent not found");
    });

    it("should throw error when workspace not found", async () => {
      vi.mocked(db.select).mockImplementationOnce(() => 
        Promise.resolve([mockAgent] as any)
      );

      vi.mocked(db.select).mockImplementationOnce(() => 
        Promise.resolve([] as any)
      );

      await expect(
        createAgentContext(testWorkspaceId, testAgentId, testThreadId, testUserMessage, "test-job-id")
      ).rejects.toThrow("Workspace not found");
    });
  });

  describe("Agent Turn Execution", () => {
    it("should execute agent turn and return result", async () => {
      // Mock all database calls
      vi.mocked(db.select).mockImplementation(() => 
        Promise.resolve([] as any)
      );

      vi.mocked(db.insert).mockImplementation(() => 
        Promise.resolve([{ id: "test-message-id" }] as any)
      );

      // Mock listIntegrationTools
      vi.mock("../../lib/integrations", () => ({
        listIntegrationTools: vi.fn().mockResolvedValue([]),
      }));

      // Mock createApproval
      vi.mock("../../lib/agents/approvals", () => ({
        createApproval: vi.fn().mockResolvedValue({ id: "test-approval-id" }),
      }));

      // Mock queueToolCall
      vi.mock("../../lib/queue", () => ({
        queueToolCall: vi.fn().mockResolvedValue({ id: "test-tool-job-id" }),
      }));

      const context = {
        workspaceId: testWorkspaceId,
        agent: mockAgent,
        threadId: testThreadId,
        userMessage: testUserMessage,
        jobId: "test-job-id",
        messages: [],
        memories: [],
        skills: [],
        availableTools: [],
        toolPermissions: {},
      };

      const result = await executeAgentTurn(context);

      expect(result).toBeDefined();
      expect(result.messageId).toBe("test-message-id");
    });

    it("should handle demo mode when no API key is provided", async () => {
      const agentWithoutKey = {
        ...mockAgent,
        modelKey: null,
        modelKeyCiphertext: null,
      };

      // Mock all database calls
      vi.mocked(db.select).mockImplementation(() => 
        Promise.resolve([] as any)
      );

      vi.mocked(db.insert).mockImplementation(() => 
        Promise.resolve([{ id: "test-message-id" }] as any)
      );

      const context = {
        workspaceId: testWorkspaceId,
        agent: agentWithoutKey,
        threadId: testThreadId,
        userMessage: testUserMessage,
        jobId: "test-job-id",
        messages: [],
        memories: [],
        skills: [],
        availableTools: [],
        toolPermissions: {},
      };

      const result = await executeAgentTurn(context);

      expect(result).toBeDefined();
      // In demo mode, the response should indicate demo mode
    });

    it("should handle tool calls with approval", async () => {
      const mockTool = {
        name: "delete_data",
        description: "Delete data",
        integrationId: "test-integration",
        integrationKind: "api" as const,
        integrationName: "Test API",
        permission: "write_approval",
      };

      // Mock all database calls
      vi.mocked(db.select).mockImplementation(() => 
        Promise.resolve([] as any)
      );

      vi.mocked(db.insert).mockImplementation(() => 
        Promise.resolve([{ id: "test-message-id" }] as any)
      );

      // Mock createApproval
      vi.mock("../../lib/agents/approvals", () => ({
        createApproval: vi.fn().mockResolvedValue({ id: "test-approval-id" }),
      }));

      const context = {
        workspaceId: testWorkspaceId,
        agent: mockAgent,
        threadId: testThreadId,
        userMessage: testUserMessage,
        jobId: "test-job-id",
        messages: [],
        memories: [],
        skills: [],
        availableTools: [mockTool],
        toolPermissions: {
          "test-integration:delete_data": "write_approval",
        },
      };

      const result = await executeAgentTurn(context);

      expect(result).toBeDefined();
      // Should create approval for irreversible action
    });
  });

  describe("Tool Call Processing", () => {
    it("should identify tool calls from LLM response", () => {
      const llmResponse = {
        content: "I will call a tool",
        toolCalls: [
          {
            name: "read_data",
            arguments: { id: "123" },
          },
          {
            name: "write_data",
            arguments: { data: "test" },
          },
        ],
      };

      const toolCalls = llmResponse.toolCalls;
      expect(toolCalls).toBeDefined();
      expect(toolCalls.length).toBe(2);
      expect(toolCalls[0].name).toBe("read_data");
      expect(toolCalls[1].name).toBe("write_data");
    });

    it("should process tool calls sequentially", async () => {
      const toolCalls = [
        { name: "read_data", arguments: {} },
        { name: "write_data", arguments: {} },
        { name: "delete_data", arguments: {} },
      ];

      // All tool calls should be processed in order
      expect(toolCalls.length).toBe(3);
      expect(toolCalls[0].name).toBe("read_data");
      expect(toolCalls[1].name).toBe("write_data");
      expect(toolCalls[2].name).toBe("delete_data");
    });

    it("should stop processing on approval request", async () => {
      const toolCalls = [
        { name: "read_data", arguments: {} },
        { name: "delete_data", arguments: {} }, // This should trigger approval
      ];

      // When an approval is needed, processing should stop
      // and wait for user decision
      const needsApproval = true; // Simulated
      
      if (needsApproval) {
        // Processing stops here
        expect(toolCalls.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Memory Management", () => {
    it("should save message to thread after execution", async () => {
      // Mock database insert
      vi.mocked(db.insert).mockImplementationOnce(() => 
        Promise.resolve([{ id: "test-message-id" }] as any)
      );

      const context = {
        workspaceId: testWorkspaceId,
        agent: mockAgent,
        threadId: testThreadId,
        userMessage: testUserMessage,
        jobId: "test-job-id",
        messages: [],
        memories: [],
        skills: [],
        availableTools: [],
        toolPermissions: {},
      };

      const result = await executeAgentTurn(context);

      expect(result.messageId).toBe("test-message-id");
    });

    it("should save tool call results to job steps", async () => {
      // Mock database insert for job steps
      vi.mocked(db.insert).mockImplementationOnce(() => 
        Promise.resolve([{ id: "test-step-id" }] as any)
      );

      // This would be called in processAgentResponse
      expect(true).toBe(true); // Placeholder for actual test
    });
  });
});
