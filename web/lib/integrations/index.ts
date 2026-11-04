import { db } from "../db";
import { integrations, apiEndpoints, toolPermissions, agents } from "../db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { encrypt, decrypt } from "../crypto";
import { v4 as uuidv4 } from "uuid";

// Integration types
import { Integration, IntegrationConfig, APIEndpoint, Tool, IntegrationKind, IntegrationStatus } from "../../types";

// ============================================
// INTEGRATION CRUD
// ============================================

/**
 * Create a new integration
 */
export async function createIntegration(
  workspaceId: string,
  data: {
    kind: IntegrationKind;
    providerName: string;
    displayName?: string;
    description?: string;
    config: IntegrationConfig;
    mcpType?: "http" | "sse" | "stdio";
    mcpUrl?: string;
    metadata?: Record<string, any>;
  }
): Promise<Integration> {
  // Encrypt sensitive config data
  const configCiphertext = encryptConfig(data.config);

  const [integration] = await db
    .insert(integrations)
    .values({
      workspaceId,
      kind: data.kind,
      providerName: data.providerName,
      displayName: data.displayName || data.providerName,
      description: data.description,
      configCiphertext,
      status: "pending",
      mcpType: data.mcpType,
      mcpUrl: data.mcpUrl,
      metadata: data.metadata || {},
    })
    .returning({
      id: integrations.id,
      workspaceId: integrations.workspaceId,
      kind: integrations.kind,
      providerName: integrations.providerName,
      displayName: integrations.displayName,
      description: integrations.description,
      configCiphertext: integrations.configCiphertext,
      status: integrations.status,
      mcpType: integrations.mcpType,
      mcpUrl: integrations.mcpUrl,
      metadata: integrations.metadata,
      createdAt: integrations.createdAt,
      updatedAt: integrations.updatedAt,
    });

  return integration;
}

/**
 * Get integration by ID
 */
export async function getIntegrationById(
  integrationId: string,
  workspaceId: string
): Promise<Integration | null> {
  const [integration] = await db
    .select({
      id: integrations.id,
      workspaceId: integrations.workspaceId,
      kind: integrations.kind,
      providerName: integrations.providerName,
      displayName: integrations.displayName,
      description: integrations.description,
      configCiphertext: integrations.configCiphertext,
      status: integrations.status,
      errorMessage: integrations.errorMessage,
      lastCheckedAt: integrations.lastCheckedAt,
      connectedAccountId: integrations.connectedAccountId,
      mcpType: integrations.mcpType,
      mcpUrl: integrations.mcpUrl,
      metadata: integrations.metadata,
      createdAt: integrations.createdAt,
      updatedAt: integrations.updatedAt,
    })
    .from(integrations)
    .where(and(
      eq(integrations.id, integrationId),
      eq(integrations.workspaceId, workspaceId)
    ))
    .limit(1);

  return integration || null;
}

/**
 * Get all integrations for a workspace
 */
export async function getIntegrationsByWorkspace(
  workspaceId: string
): Promise<Integration[]> {
  return await db
    .select({
      id: integrations.id,
      workspaceId: integrations.workspaceId,
      kind: integrations.kind,
      providerName: integrations.providerName,
      displayName: integrations.displayName,
      description: integrations.description,
      configCiphertext: integrations.configCiphertext,
      status: integrations.status,
      errorMessage: integrations.errorMessage,
      lastCheckedAt: integrations.lastCheckedAt,
      connectedAccountId: integrations.connectedAccountId,
      mcpType: integrations.mcpType,
      mcpUrl: integrations.mcpUrl,
      metadata: integrations.metadata,
      createdAt: integrations.createdAt,
      updatedAt: integrations.updatedAt,
    })
    .from(integrations)
    .where(eq(integrations.workspaceId, workspaceId))
    .orderBy(desc(integrations.createdAt));
}

/**
 * Update an integration
 */
export async function updateIntegration(
  integrationId: string,
  workspaceId: string,
  data: {
    displayName?: string;
    description?: string;
    config?: IntegrationConfig;
    status?: IntegrationStatus;
    errorMessage?: string;
    connectedAccountId?: string;
    mcpType?: "http" | "sse" | "stdio";
    mcpUrl?: string;
    metadata?: Record<string, any>;
  }
): Promise<Integration | null> {
  // Get existing integration
  const existing = await getIntegrationById(integrationId, workspaceId);
  if (!existing) {
    return null;
  }

  // Encrypt new config if provided
  let configCiphertext = existing.configCiphertext;
  if (data.config) {
    configCiphertext = encryptConfig(data.config);
  }

  const [integration] = await db
    .update(integrations)
    .set({
      displayName: data.displayName,
      description: data.description,
      configCiphertext,
      status: data.status,
      errorMessage: data.errorMessage,
      connectedAccountId: data.connectedAccountId,
      mcpType: data.mcpType,
      mcpUrl: data.mcpUrl,
      metadata: data.metadata,
      lastCheckedAt: data.status ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(and(
      eq(integrations.id, integrationId),
      eq(integrations.workspaceId, workspaceId)
    ))
    .returning({
      id: integrations.id,
      workspaceId: integrations.workspaceId,
      kind: integrations.kind,
      providerName: integrations.providerName,
      displayName: integrations.displayName,
      description: integrations.description,
      configCiphertext: integrations.configCiphertext,
      status: integrations.status,
      errorMessage: integrations.errorMessage,
      lastCheckedAt: integrations.lastCheckedAt,
      connectedAccountId: integrations.connectedAccountId,
      mcpType: integrations.mcpType,
      mcpUrl: integrations.mcpUrl,
      metadata: integrations.metadata,
      createdAt: integrations.createdAt,
      updatedAt: integrations.updatedAt,
    });

  return integration;
}

/**
 * Delete an integration
 */
export async function deleteIntegration(
  integrationId: string,
  workspaceId: string
): Promise<boolean> {
  const [result] = await db
    .delete(integrations)
    .where(and(
      eq(integrations.id, integrationId),
      eq(integrations.workspaceId, workspaceId)
    ))
    .returning({ id: integrations.id });

  return !!result;
}

/**
 * Encrypt integration config
 */
function encryptConfig(config: IntegrationConfig): string {
  const encryptionKey = process.env.ENCRYPTION_KEY!;
  return encrypt(JSON.stringify(config), encryptionKey);
}

/**
 * Decrypt integration config
 */
export function decryptConfig(configCiphertext: string): IntegrationConfig {
  const encryptionKey = process.env.ENCRYPTION_KEY!;
  const decrypted = decrypt(configCiphertext, encryptionKey);
  return JSON.parse(decrypted) as IntegrationConfig;
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Create an API endpoint for custom integration
 */
export async function createAPIEndpoint(
  integrationId: string,
  workspaceId: string,
  data: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    path: string;
    description?: string;
    toolName?: string;
    toolDescription?: string;
    parametersSchema?: any;
  }
): Promise<APIEndpoint> {
  const [endpoint] = await db
    .insert(apiEndpoints)
    .values({
      integrationId,
      method: data.method,
      path: data.path,
      description: data.description,
      toolName: data.toolName || `${data.method} ${data.path}`,
      toolDescription: data.toolDescription,
      parametersSchema: data.parametersSchema,
    })
    .returning({
      id: apiEndpoints.id,
      integrationId: apiEndpoints.integrationId,
      method: apiEndpoints.method,
      path: apiEndpoints.path,
      description: apiEndpoints.description,
      toolName: apiEndpoints.toolName,
      toolDescription: apiEndpoints.toolDescription,
      parametersSchema: apiEndpoints.parametersSchema,
      createdAt: apiEndpoints.createdAt,
      updatedAt: apiEndpoints.updatedAt,
    });

  return endpoint;
}

/**
 * Get API endpoints for an integration
 */
export async function getAPIEndpointsByIntegration(
  integrationId: string,
  workspaceId: string
): Promise<APIEndpoint[]> {
  return await db
    .select({
      id: apiEndpoints.id,
      integrationId: apiEndpoints.integrationId,
      method: apiEndpoints.method,
      path: apiEndpoints.path,
      description: apiEndpoints.description,
      toolName: apiEndpoints.toolName,
      toolDescription: apiEndpoints.toolDescription,
      parametersSchema: apiEndpoints.parametersSchema,
      createdAt: apiEndpoints.createdAt,
      updatedAt: apiEndpoints.updatedAt,
    })
    .from(apiEndpoints)
    .where(and(
      eq(apiEndpoints.integrationId, integrationId),
      eq(integrations.workspaceId, workspaceId)
    ))
    .orderBy(desc(apiEndpoints.createdAt));
}

/**
 * Delete an API endpoint
 */
export async function deleteAPIEndpoint(
  endpointId: string,
  workspaceId: string
): Promise<boolean> {
  const [result] = await db
    .delete(apiEndpoints)
    .where(and(
      eq(apiEndpoints.id, endpointId),
      eq(integrations.workspaceId, workspaceId)
    ))
    .returning({ id: apiEndpoints.id });

  return !!result;
}

// ============================================
// TOOL PERMISSIONS
// ============================================

/**
 * Set tool permission for an agent
 */
export async function setToolPermission(
  agentId: string,
  integrationId: string,
  toolName: string,
  scope: "read" | "write_approval" | "blocked",
  workspaceId: string
): Promise<any> {
  // Verify agent and integration exist
  const [agent] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(and(
      eq(agents.id, agentId),
      eq(agents.workspaceId, workspaceId)
    ))
    .limit(1);

  if (!agent) {
    throw new Error("Agent not found");
  }

  const [integration] = await db
    .select({ id: integrations.id })
    .from(integrations)
    .where(and(
      eq(integrations.id, integrationId),
      eq(integrations.workspaceId, workspaceId)
    ))
    .limit(1);

  if (!integration) {
    throw new Error("Integration not found");
  }

  const [permission] = await db
    .insert(toolPermissions)
    .values({
      agentId,
      integrationId,
      toolName,
      scope,
    })
    .onConflictDoUpdate({
      target: [toolPermissions.agentId, toolPermissions.integrationId, toolPermissions.toolName],
      set: {
        scope,
        updatedAt: new Date(),
      },
    })
    .returning();

  return permission;
}

/**
 * Get tool permissions for an agent
 */
export async function getToolPermissionsByAgent(
  agentId: string,
  workspaceId: string
): Promise<any[]> {
  return await db
    .select({
      id: toolPermissions.id,
      agentId: toolPermissions.agentId,
      integrationId: toolPermissions.integrationId,
      toolName: toolPermissions.toolName,
      scope: toolPermissions.scope,
      integration: {
        id: integrations.id,
        kind: integrations.kind,
        providerName: integrations.providerName,
        displayName: integrations.displayName,
      },
    })
    .from(toolPermissions)
    .leftJoin(integrations, eq(toolPermissions.integrationId, integrations.id))
    .where(and(
      eq(toolPermissions.agentId, agentId),
      eq(integrations.workspaceId, workspaceId)
    ))
    .orderBy(desc(toolPermissions.createdAt));
}

/**
 * Get available tools for an agent
 */
export async function getAvailableToolsForAgent(
  agentId: string,
  workspaceId: string
): Promise<Tool[]> {
  // Get all integrations for workspace
  const integrationsList = await getIntegrationsByWorkspace(workspaceId);
  const availableTools: Tool[] = [];

  for (const integration of integrationsList) {
    if (integration.status !== "connected") {
      continue;
    }

    // Get tools based on integration kind
    let tools: { name: string; description: string; parameters?: any }[] = [];

    switch (integration.kind) {
      case "composio":
        tools = await listComposioTools(integration);
        break;
      case "mcp":
        tools = await listMCPTools(integration);
        break;
      case "api":
        const endpoints = await getAPIEndpointsByIntegration(integration.id, workspaceId);
        tools = endpoints.map((endpoint) => ({
          name: endpoint.toolName || `${endpoint.method} ${endpoint.path}`,
          description: endpoint.toolDescription || endpoint.description || "",
          parameters: endpoint.parametersSchema,
        }));
        break;
    }

    // Get permissions for this agent
    const permissions = await getToolPermissionsByAgent(agentId, workspaceId);
    const permissionMap: Record<string, "read" | "write_approval" | "blocked"> = {};
    permissions.forEach((p) => {
      permissionMap[`${p.integrationId}:${p.toolName}`] = p.scope;
    });

    // Add tools with permissions
    for (const tool of tools) {
      const permissionKey = `${integration.id}:${tool.name}`;
      const scope = permissionMap[permissionKey] || "read";

      if (scope !== "blocked") {
        availableTools.push({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          integrationId: integration.id,
          integrationKind: integration.kind,
          integrationName: integration.displayName || integration.providerName,
          permission: scope,
        });
      }
    }
  }

  return availableTools;
}

// ============================================
// COMPOSIO INTEGRATION
// ============================================

/**
 * Initialize Composio client
 */
export async function initializeComposio(workspaceId: string): Promise<any> {
  // Get Composio API key from workspace settings
  // In production, this would be fetched from the database
  const composioKey = process.env.COMPOSIO_API_KEY;

  if (!composioKey) {
    throw new Error("Composio API key not configured");
  }

  try {
    // Import Composio dynamically
    const { ComposioClient } = await import("@composio/core");
    
    const client = new ComposioClient({
      apiKey: composioKey,
    });

    return client;
  } catch (error) {
    console.error("Error initializing Composio:", error);
    throw new Error("Failed to initialize Composio client");
  }
}

/**
 * Connect to Composio
 */
export async function connectComposio(
  workspaceId: string,
  appName: string
): Promise<{ integrationId: string; accountId: string }> {
  try {
    const client = await initializeComposio(workspaceId);

    // Connect to the app
    const connection = await client.connect(appName);

    // Create integration record
    const integration = await createIntegration(workspaceId, {
      kind: "composio",
      providerName: appName,
      displayName: `Composio - ${appName}`,
      description: `Integración con ${appName} vía Composio`,
      config: {
        appId: appName,
        accountId: connection.accountId,
      },
    });

    // Update integration with connected status
    await updateIntegration(integration.id, workspaceId, {
      status: "connected",
      connectedAccountId: connection.accountId,
    });

    return {
      integrationId: integration.id,
      accountId: connection.accountId,
    };
  } catch (error) {
    console.error("Error connecting to Composio:", error);
    throw error;
  }
}

/**
 * List available Composio apps
 */
export async function listComposioApps(workspaceId: string): Promise<any[]> {
  try {
    const client = await initializeComposio(workspaceId);
    const apps = await client.listApps();
    return apps;
  } catch (error) {
    console.error("Error listing Composio apps:", error);
    return [];
  }
}

/**
 * List tools for a Composio integration
 */
export async function listComposioTools(integration: Integration): Promise<any[]> {
  try {
    const client = await initializeComposio(integration.workspaceId);
    const config = decryptConfig(integration.configCiphertext);
    const tools = await client.listTools(config.appId);
    return tools;
  } catch (error) {
    console.error("Error listing Composio tools:", error);
    return [];
  }
}

/**
 * Execute a Composio tool
 */
export async function executeComposioTool(
  integrationId: string,
  workspaceId: string,
  toolName: string,
  args: any
): Promise<any> {
  try {
    const integration = await getIntegrationById(integrationId, workspaceId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    const client = await initializeComposio(workspaceId);
    const config = decryptConfig(integration.configCiphertext);

    const result = await client.executeAction(config.appId, toolName, args);
    return result;
  } catch (error) {
    console.error("Error executing Composio tool:", error);
    throw error;
  }
}

// ============================================
// MCP INTEGRATION
// ============================================

/**
 * Initialize MCP client
 */
export async function initializeMCP(workspaceId: string): Promise<any> {
  // Import MCP SDK dynamically
  try {
    const { Client } = await import("@modelcontextprotocol/sdk");
    return Client;
  } catch (error) {
    console.error("Error importing MCP SDK:", error);
    throw new Error("MCP SDK not available");
  }
}

/**
 * Connect to an MCP server
 */
export async function connectMCPServer(
  workspaceId: string,
  url: string,
  type: "http" | "sse" | "stdio"
): Promise<{ integrationId: string }> {
  try {
    const Client = await initializeMCP(workspaceId);

    // Create integration record
    const integration = await createIntegration(workspaceId, {
      kind: "mcp",
      providerName: `MCP Server - ${url}`,
      displayName: `MCP Server`,
      description: `Servidor MCP en ${url}`,
      config: {
        url,
        type,
      },
      mcpType: type,
      mcpUrl: url,
    });

    // Test connection and list tools
    try {
      const client = new Client({ url, type });
      const tools = await client.listTools();

      // Update integration with connected status
      await updateIntegration(integration.id, workspaceId, {
        status: "connected",
        metadata: {
          tools: tools.map((t: any) => t.name),
        },
      });

      return { integrationId: integration.id };
    } catch (connectionError) {
      // Update integration with error status
      await updateIntegration(integration.id, workspaceId, {
        status: "error",
        errorMessage: `Failed to connect: ${connectionError instanceof Error ? connectionError.message : "Unknown error"}`,
      });
      throw connectionError;
    }
  } catch (error) {
    console.error("Error connecting to MCP server:", error);
    throw error;
  }
}

/**
 * List tools for an MCP integration
 */
export async function listMCPTools(integration: Integration): Promise<any[]> {
  try {
    const Client = await initializeMCP(integration.workspaceId);
    const config = decryptConfig(integration.configCiphertext);

    const client = new Client({ url: config.url, type: config.type });
    const tools = await client.listTools();
    return tools;
  } catch (error) {
    console.error("Error listing MCP tools:", error);
    return [];
  }
}

/**
 * Execute an MCP tool
 */
export async function executeMCPTool(
  integrationId: string,
  workspaceId: string,
  toolName: string,
  args: any
): Promise<any> {
  try {
    const integration = await getIntegrationById(integrationId, workspaceId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    const Client = await initializeMCP(workspaceId);
    const config = decryptConfig(integration.configCiphertext);

    const client = new Client({ url: config.url, type: config.type });
    const result = await client.callTool(toolName, args);
    return result;
  } catch (error) {
    console.error("Error executing MCP tool:", error);
    throw error;
  }
}

// ============================================
// CUSTOM API INTEGRATION
// ============================================

/**
 * Execute a custom API tool
 */
export async function executeCustomAPITool(
  integrationId: string,
  endpointId: string,
  workspaceId: string,
  method: string,
  path: string,
  args: any
): Promise<any> {
  try {
    // Get integration
    const integration = await getIntegrationById(integrationId, workspaceId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    // Get endpoint
    const endpoints = await getAPIEndpointsByIntegration(integrationId, workspaceId);
    const endpoint = endpoints.find((e) => e.id === endpointId);
    if (!endpoint) {
      throw new Error("Endpoint not found");
    }

    // Decrypt config
    const config = decryptConfig(integration.configCiphertext);

    // Build URL
    const baseUrl = config.baseUrl || "";
    const url = new URL(path, baseUrl).toString();

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add authentication
    if (config.authType === "bearer" && config.authValue) {
      headers["Authorization"] = `Bearer ${config.authValue}`;
    } else if (config.authType === "header" && config.authKey && config.authValue) {
      headers[config.authKey] = config.authValue;
    } else if (config.authType === "query" && config.authKey && config.authValue) {
      // Add to URL query params
      const urlObj = new URL(url);
      urlObj.searchParams.set(config.authKey, config.authValue);
    }

    // Make request
    const options: RequestInit = {
      method: method as any,
      headers,
    };

    if (method !== "GET" && method !== "HEAD") {
      options.body = JSON.stringify(args);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error executing custom API tool:", error);
    throw error;
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  createIntegration,
  getIntegrationById,
  getIntegrationsByWorkspace,
  updateIntegration,
  deleteIntegration,
  decryptConfig,
  createAPIEndpoint,
  getAPIEndpointsByIntegration,
  deleteAPIEndpoint,
  setToolPermission,
  getToolPermissionsByAgent,
  getAvailableToolsForAgent,
  initializeComposio,
  connectComposio,
  listComposioApps,
  listComposioTools,
  executeComposioTool,
  initializeMCP,
  connectMCPServer,
  listMCPTools,
  executeMCPTool,
  executeCustomAPITool,
};
