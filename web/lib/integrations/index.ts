import { db } from "../db";
import { integrations, apiEndpoints, toolPermissions, agents, workspaces } from "../db/schema";
import { eq, and, or, desc, like } from "drizzle-orm";
import { encrypt, decrypt } from "../crypto";
import { ComposioClient } from "@composio/core";
import { Client as MCPClient } from "@modelcontextprotocol/sdk/client";

// Integration types
export type IntegrationKind = "composio" | "mcp" | "api";
export type IntegrationStatus = "connected" | "disconnected" | "error" | "pending";

export interface Integration {
  id: string;
  workspaceId: string;
  kind: IntegrationKind;
  providerName: string;
  displayName: string | null;
  description: string | null;
  configCiphertext: string;
  status: IntegrationStatus;
  errorMessage: string | null;
  lastCheckedAt: Date | null;
  connectedAccountId: string | null;
  mcpType: string | null;
  mcpUrl: string | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIEndpoint {
  id: string;
  integrationId: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string | null;
  toolName: string | null;
  toolDescription: string | null;
  parametersSchema: any;
  createdAt: Date;
  updatedAt: Date;
}

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
    config: any;
    mcpType?: string;
    mcpUrl?: string;
    metadata?: any;
  }
): Promise<Integration> {
  const encryptionKey = process.env.ENCRYPTION_KEY!;
  const configCiphertext = encrypt(data.config, encryptionKey);

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
      errorMessage: integrations.errorMessage,
      lastCheckedAt: integrations.lastCheckedAt,
      connectedAccountId: integrations.connectedAccountId,
      mcpType: integrations.mcpType,
      mcpUrl: integrations.mcpUrl,
      metadata: integrations.metadata,
      createdAt: integrations.createdAt,
      updatedAt: integrations.updatedAt,
    });

  // Try to connect immediately for Composio
  if (data.kind === "composio") {
    await connectComposioIntegration(integration.id);
  }

  // Try to connect immediately for MCP
  if (data.kind === "mcp") {
    await connectMCPIntegration(integration.id);
  }

  return integration;
}

/**
 * Get integration by ID
 */
export async function getIntegrationById(integrationId: string): Promise<Integration | null> {
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
    .where(eq(integrations.id, integrationId))
    .limit(1);

  return integration || null;
}

/**
 * Get integrations for a workspace
 */
export async function getIntegrationsByWorkspace(workspaceId: string): Promise<Integration[]> {
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
    config?: any;
    mcpType?: string;
    mcpUrl?: string;
    metadata?: any;
  }
): Promise<Integration | null> {
  const existingIntegration = await getIntegrationById(integrationId);
  if (!existingIntegration || existingIntegration.workspaceId !== workspaceId) {
    return null;
  }

  const encryptionKey = process.env.ENCRYPTION_KEY!;
  let configCiphertext = existingIntegration.configCiphertext;
  
  if (data.config) {
    configCiphertext = encrypt(data.config, encryptionKey);
  }

  const [integration] = await db
    .update(integrations)
    .set({
      displayName: data.displayName,
      description: data.description,
      configCiphertext,
      mcpType: data.mcpType,
      mcpUrl: data.mcpUrl,
      metadata: data.metadata,
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
export async function deleteIntegration(integrationId: string, workspaceId: string): Promise<boolean> {
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
 * Toggle integration status
 */
export async function toggleIntegrationStatus(
  integrationId: string,
  workspaceId: string
): Promise<Integration | null> {
  const [integration] = await db
    .select({
      id: integrations.id,
      workspaceId: integrations.workspaceId,
      status: integrations.status,
    })
    .from(integrations)
    .where(and(
      eq(integrations.id, integrationId),
      eq(integrations.workspaceId, workspaceId)
    ))
    .limit(1);

  if (!integration) {
    return null;
  }

  const newStatus = integration.status === "connected" ? "disconnected" : "connected";

  const [updated] = await db
    .update(integrations)
    .set({
      status: newStatus,
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

  return updated;
}

// ============================================
// COMPOSIO INTEGRATION
// ============================================

// Composio client cache
let composioClient: ComposioClient | null = null;

/**
 * Initialize Composio client
 */
function getComposioClient(): ComposioClient {
  if (!composioClient) {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey) {
      throw new Error("Composio API key not configured");
    }
    composioClient = new ComposioClient({ apiKey });
  }
  return composioClient;
}

/**
 * Connect Composio integration
 */
export async function connectComposioIntegration(integrationId: string): Promise<boolean> {
  const integration = await getIntegrationById(integrationId);
  if (!integration || integration.kind !== "composio") {
    return false;
  }

  try {
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const config = decrypt(integration.configCiphertext, encryptionKey);
    
    // For Composio, config should contain the provider-specific data
    // In a real implementation, we'd use the Composio SDK to connect
    
    // Simulate connection
    await db
      .update(integrations)
      .set({
        status: "connected",
        lastCheckedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(integrations.id, integrationId));

    return true;
  } catch (error) {
    console.error("Composio connection failed:", error);
    
    await db
      .update(integrations)
      .set({
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        lastCheckedAt: new Date(),
      })
      .where(eq(integrations.id, integrationId));

    return false;
  }
}

/**
 * Get Composio apps catalog
 */
export async function getComposioApps(): Promise<any[]> {
  try {
    const client = getComposioClient();
    // In a real implementation, we'd fetch the catalog from Composio
    // This is a placeholder
    return [
      { id: "google_calendar", name: "Google Calendar", description: "Gestiona eventos y calendarios de Google" },
      { id: "gmail", name: "Gmail", description: "Envía y recibe correos electrónicos" },
      { id: "google_drive", name: "Google Drive", description: "Gestiona archivos en Google Drive" },
      { id: "slack", name: "Slack", description: "Envía mensajes y gestiona canales de Slack" },
      { id: "github", name: "GitHub", description: "Gestiona repositorios y issues de GitHub" },
      { id: "notion", name: "Notion", description: "Gestiona páginas y bases de datos de Notion" },
      { id: "linkedin", name: "LinkedIn", description: "Gestiona conexiones y publicaciones de LinkedIn" },
      { id: "twitter", name: "Twitter/X", description: "Gestiona tweets y timeline de Twitter" },
    ];
  } catch (error) {
    console.error("Failed to fetch Composio apps:", error);
    return [];
  }
}

/**
 * Connect a Composio app
 */
export async function connectComposioApp(
  workspaceId: string,
  appId: string,
  accountId?: string
): Promise<Integration | null> {
  try {
    const app = (await getComposioApps()).find((a) => a.id === appId);
    if (!app) {
      throw new Error("App not found");
    }

    // Create integration
    const integration = await createIntegration(workspaceId, {
      kind: "composio",
      providerName: appId,
      displayName: app.name,
      description: app.description,
      config: {
        appId,
        accountId,
        connectedAt: new Date().toISOString(),
      },
    });

    return integration;
  } catch (error) {
    console.error("Failed to connect Composio app:", error);
    return null;
  }
}

/**
 * Disconnect a Composio app
 */
export async function disconnectComposioApp(integrationId: string, workspaceId: string): Promise<boolean> {
  return await deleteIntegration(integrationId, workspaceId);
}

/**
 * List tools for a Composio integration
 */
export async function listComposioTools(integrationId: string): Promise<any[]> {
  const integration = await getIntegrationById(integrationId);
  if (!integration || integration.kind !== "composio") {
    return [];
  }

  try {
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const config = decrypt(integration.configCiphertext, encryptionKey);
    const appId = config.appId;

    // In a real implementation, we'd fetch tools from Composio
    // This is a placeholder with example tools
    const appTools: Record<string, any[]> = {
      google_calendar: [
        { name: "create_event", description: "Crea un nuevo evento en el calendario" },
        { name: "list_events", description: "Lista eventos del calendario" },
        { name: "update_event", description: "Actualiza un evento existente" },
        { name: "delete_event", description: "Elimina un evento del calendario" },
      ],
      gmail: [
        { name: "send_email", description: "Envía un correo electrónico" },
        { name: "list_emails", description: "Lista correos electrónicos" },
        { name: "get_email", description: "Obtiene un correo electrónico" },
      ],
      slack: [
        { name: "post_message", description: "Publica un mensaje en un canal" },
        { name: "list_channels", description: "Lista canales de Slack" },
      ],
      github: [
        { name: "create_issue", description: "Crea un nuevo issue" },
        { name: "list_issues", description: "Lista issues de un repositorio" },
      ],
    };

    return appTools[appId] || [];
  } catch (error) {
    console.error("Failed to list Composio tools:", error);
    return [];
  }
}

// ============================================
// MCP INTEGRATION
// ============================================

/**
 * Connect MCP integration
 */
export async function connectMCPIntegration(integrationId: string): Promise<boolean> {
  const integration = await getIntegrationById(integrationId);
  if (!integration || integration.kind !== "mcp") {
    return false;
  }

  try {
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const config = decrypt(integration.configCiphertext, encryptionKey);
    
    // Validate MCP URL
    if (!config.url) {
      throw new Error("MCP URL is required");
    }

    // Check if URL is valid
    let url: URL;
    try {
      url = new URL(config.url);
    } catch {
      throw new Error("Invalid MCP URL");
    }

    // In a real implementation, we'd test the connection
    // For now, just mark as connected
    
    await db
      .update(integrations)
      .set({
        status: "connected",
        mcpUrl: config.url,
        mcpType: config.type || "http",
        lastCheckedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(integrations.id, integrationId));

    return true;
  } catch (error) {
    console.error("MCP connection failed:", error);
    
    await db
      .update(integrations)
      .set({
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        lastCheckedAt: new Date(),
      })
      .where(eq(integrations.id, integrationId));

    return false;
  }
}

/**
 * List tools for an MCP integration
 */
export async function listMCPTools(integrationId: string): Promise<any[]> {
  const integration = await getIntegrationById(integrationId);
  if (!integration || integration.kind !== "mcp" || !integration.mcpUrl) {
    return [];
  }

  try {
    // In a real implementation, we'd connect to the MCP server
    // and fetch the available tools
    
    // For now, return a placeholder
    return [
      { name: "list_resources", description: "Lista recursos disponibles" },
      { name: "read_resource", description: "Lee un recurso" },
      { name: "custom_tool", description: "Herramienta personalizada del servidor MCP" },
    ];
  } catch (error) {
    console.error("Failed to list MCP tools:", error);
    return [];
  }
}

/**
 * Test MCP connection
 */
export async function testMCPConnection(integrationId: string): Promise<boolean> {
  const integration = await getIntegrationById(integrationId);
  if (!integration || integration.kind !== "mcp" || !integration.mcpUrl) {
    return false;
  }

  try {
    // In a real implementation, we'd test the connection
    // For now, just return true
    return true;
  } catch (error) {
    console.error("MCP connection test failed:", error);
    return false;
  }
}

// ============================================
// CUSTOM API INTEGRATION
// ============================================

/**
 * Create a custom API integration
 */
export async function createAPIIntegration(
  workspaceId: string,
  data: {
    name: string;
    baseUrl: string;
    authType: "bearer" | "header" | "query" | "none";
    authKey?: string;
    authValue?: string;
    description?: string;
  }
): Promise<Integration> {
  const encryptionKey = process.env.ENCRYPTION_KEY!;
  
  const config = {
    baseUrl: data.baseUrl,
    authType: data.authType,
    authKey: data.authKey,
    authValue: data.authValue,
  };

  const configCiphertext = encrypt(config, encryptionKey);

  const [integration] = await db
    .insert(integrations)
    .values({
      workspaceId,
      kind: "api",
      providerName: data.name,
      displayName: data.name,
      description: data.description,
      configCiphertext,
      status: "connected",
      metadata: {
        type: "custom_api",
      },
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
 * Create an API endpoint (tool)
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
      toolName: data.toolName || `${data.method} ${data.path}`.replace(/\/\/g, "_"),
      toolDescription: data.toolDescription || data.description,
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
export async function getAPIEndpoints(integrationId: string): Promise<APIEndpoint[]> {
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
    .where(eq(apiEndpoints.integrationId, integrationId))
    .orderBy(desc(apiEndpoints.createdAt));
}

/**
 * Update an API endpoint
 */
export async function updateAPIEndpoint(
  endpointId: string,
  integrationId: string,
  workspaceId: string,
  data: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    path?: string;
    description?: string;
    toolName?: string;
    toolDescription?: string;
    parametersSchema?: any;
  }
): Promise<APIEndpoint | null> {
  const [endpoint] = await db
    .update(apiEndpoints)
    .set({
      method: data.method,
      path: data.path,
      description: data.description,
      toolName: data.toolName,
      toolDescription: data.toolDescription,
      parametersSchema: data.parametersSchema,
      updatedAt: new Date(),
    })
    .where(and(
      eq(apiEndpoints.id, endpointId),
      eq(apiEndpoints.integrationId, integrationId)
    ))
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
 * Delete an API endpoint
 */
export async function deleteAPIEndpoint(
  endpointId: string,
  integrationId: string,
  workspaceId: string
): Promise<boolean> {
  const [result] = await db
    .delete(apiEndpoints)
    .where(and(
      eq(apiEndpoints.id, endpointId),
      eq(apiEndpoints.integrationId, integrationId)
    ))
    .returning({ id: apiEndpoints.id });

  return !!result;
}

// ============================================
// TOOL LISTING
// ============================================

/**
 * List all tools for an integration
 */
export async function listIntegrationTools(integrationId: string): Promise<any[]> {
  const integration = await getIntegrationById(integrationId);
  if (!integration) {
    return [];
  }

  try {
    switch (integration.kind) {
      case "composio":
        return await listComposioTools(integrationId);
      case "mcp":
        return await listMCPTools(integrationId);
      case "api":
        const endpoints = await getAPIEndpoints(integrationId);
        return endpoints.map((endpoint) => ({
          name: endpoint.toolName || endpoint.path,
          description: endpoint.toolDescription || endpoint.description || "",
          method: endpoint.method,
          path: endpoint.path,
          parametersSchema: endpoint.parametersSchema,
        }));
      default:
        return [];
    }
  } catch (error) {
    console.error("Failed to list integration tools:", error);
    return [];
  }
}

// ============================================
// TOOL EXECUTION
// ============================================

/**
 * Call a tool from an integration
 */
export async function callTool(
  integrationId: string,
  toolName: string,
  payload: any
): Promise<any> {
  const integration = await getIntegrationById(integrationId);
  if (!integration) {
    throw new Error("Integration not found");
  }

  const encryptionKey = process.env.ENCRYPTION_KEY!;
  const config = decrypt(integration.configCiphertext, encryptionKey);

  try {
    switch (integration.kind) {
      case "composio":
        return await callComposioTool(integrationId, toolName, payload);
      case "mcp":
        return await callMCPTool(integrationId, toolName, payload);
      case "api":
        return await callAPITool(integrationId, toolName, payload);
      default:
        throw new Error(`Unknown integration kind: ${integration.kind}`);
    }
  } catch (error) {
    console.error(`Tool call failed for ${toolName}:`, error);
    throw error;
  }
}

/**
 * Call a Composio tool
 */
async function callComposioTool(
  integrationId: string,
  toolName: string,
  payload: any
): Promise<any> {
  const integration = await getIntegrationById(integrationId);
  if (!integration) {
    throw new Error("Integration not found");
  }

  const encryptionKey = process.env.ENCRYPTION_KEY!;
  const config = decrypt(integration.configCiphertext, encryptionKey);

  // In a real implementation, we'd use the Composio SDK
  // For now, simulate a response
  
  console.log(`Calling Composio tool ${toolName} with payload:`, payload);
  
  return {
    success: true,
    result: `Tool ${toolName} executed successfully`,
    data: payload,
  };
}

/**
 * Call an MCP tool
 */
async function callMCPTool(
  integrationId: string,
  toolName: string,
  payload: any
): Promise<any> {
  const integration = await getIntegrationById(integrationId);
  if (!integration || !integration.mcpUrl) {
    throw new Error("MCP integration not configured");
  }

  // In a real implementation, we'd connect to the MCP server
  // For now, simulate a response
  
  console.log(`Calling MCP tool ${toolName} with payload:`, payload);
  
  return {
    success: true,
    result: `MCP tool ${toolName} executed successfully`,
    data: payload,
  };
}

/**
 * Call a custom API tool
 */
async function callAPITool(
  integrationId: string,
  toolName: string,
  payload: any
): Promise<any> {
  const integration = await getIntegrationById(integrationId);
  if (!integration) {
    throw new Error("Integration not found");
  }

  const encryptionKey = process.env.ENCRYPTION_KEY!;
  const config = decrypt(integration.configCiphertext, encryptionKey);

  // Find the endpoint by tool name
  const endpoints = await getAPIEndpoints(integrationId);
  const endpoint = endpoints.find((e) => e.toolName === toolName);
  
  if (!endpoint) {
    throw new Error(`Endpoint ${toolName} not found`);
  }

  // Build URL
  const url = new URL(endpoint.path, config.baseUrl);
  
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
    url.searchParams.append(config.authKey, config.authValue);
  }

  // Make the request
  const response = await fetch(url.toString(), {
    method: endpoint.method,
    headers,
    body: JSON.stringify(payload),
    // Timeout and retry logic would go here
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// ============================================
// INTEGRATION STATUS
// ============================================

/**
 * Check integration status
 */
export async function checkIntegrationStatus(integrationId: string): Promise<IntegrationStatus> {
  const integration = await getIntegrationById(integrationId);
  if (!integration) {
    throw new Error("Integration not found");
  }

  try {
    switch (integration.kind) {
      case "composio":
        // Check Composio connection
        return await checkComposioStatus(integrationId);
      case "mcp":
        return await checkMCPStatus(integrationId);
      case "api":
        return await checkAPIStatus(integrationId);
      default:
        return "disconnected";
    }
  } catch (error) {
    console.error("Integration status check failed:", error);
    return "error";
  }
}

/**
 * Check Composio status
 */
async function checkComposioStatus(integrationId: string): Promise<IntegrationStatus> {
  const integration = await getIntegrationById(integrationId);
  if (!integration) {
    return "disconnected";
  }

  // In a real implementation, we'd check the actual connection
  return integration.status;
}

/**
 * Check MCP status
 */
async function checkMCPStatus(integrationId: string): Promise<IntegrationStatus> {
  const integration = await getIntegrationById(integrationId);
  if (!integration) {
    return "disconnected";
  }

  // Test the connection
  const connected = await testMCPConnection(integrationId);
  return connected ? "connected" : "disconnected";
}

/**
 * Check API status
 */
async function checkAPIStatus(integrationId: string): Promise<IntegrationStatus> {
  const integration = await getIntegrationById(integrationId);
  if (!integration) {
    return "disconnected";
  }

  try {
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    const config = decrypt(integration.configCiphertext, encryptionKey);
    
    // Try to make a test request
    const url = new URL(config.baseUrl);
    const testUrl = new URL("/", url);
    
    const headers: Record<string, string> = {};
    if (config.authType === "bearer" && config.authValue) {
      headers["Authorization"] = `Bearer ${config.authValue}`;
    }

    // Make a HEAD request to test connectivity
    const response = await fetch(testUrl.toString(), {
      method: "HEAD",
      headers,
    });

    return response.ok ? "connected" : "error";
  } catch {
    return "error";
  }
}

/**
 * Recheck all integrations for a workspace
 */
export async function recheckIntegrations(workspaceId: string): Promise<void> {
  const integrationsList = await getIntegrationsByWorkspace(workspaceId);
  
  for (const integration of integrationsList) {
    const status = await checkIntegrationStatus(integration.id);
    
    await db
      .update(integrations)
      .set({
        status,
        lastCheckedAt: new Date(),
      })
      .where(eq(integrations.id, integration.id));
  }
}

// ============================================
// OAUTH HANDLERS
// ============================================

/**
 * Start OAuth flow for Composio
 */
export async function startComposioOAuth(
  workspaceId: string,
  provider: string,
  redirectUri: string
): Promise<{ authUrl: string; state: string }> {
  // In a real implementation, we'd use the Composio SDK
  // For now, return a placeholder
  
  const state = generateStateToken(workspaceId, provider);
  const authUrl = `https://composio.dev/oauth/${provider}?state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  return { authUrl, state };
}

/**
 * Handle OAuth callback for Composio
 */
export async function handleComposioOAuthCallback(
  workspaceId: string,
  provider: string,
  code: string,
  state: string
): Promise<Integration | null> {
  // Validate state
  if (!validateStateToken(state, workspaceId, provider)) {
    throw new Error("Invalid state token");
  }

  // In a real implementation, we'd exchange the code for tokens
  // For now, create a connected integration
  
  const integration = await createIntegration(workspaceId, {
    kind: "composio",
    providerName: provider,
    displayName: provider,
    config: {
      provider,
      connectedAt: new Date().toISOString(),
    },
  });

  // Mark as connected
  await db
    .update(integrations)
    .set({
      status: "connected",
      lastCheckedAt: new Date(),
    })
    .where(eq(integrations.id, integration.id));

  return integration;
}

/**
 * Generate state token for OAuth
 */
function generateStateToken(workspaceId: string, provider: string): string {
  const token = `${workspaceId}:${provider}:${Date.now()}`;
  // In production, sign this token
  return Buffer.from(token).toString("base64");
}

/**
 * Validate state token
 */
function validateStateToken(state: string, workspaceId: string, provider: string): boolean {
  try {
    const decoded = Buffer.from(state, "base64").toString("utf-8");
    const [wid, p, timestamp] = decoded.split(":");
    
    // Check if token is recent (within 5 minutes)
    const now = Date.now();
    const tokenTime = parseInt(timestamp);
    const isRecent = now - tokenTime < 5 * 60 * 1000;
    
    return wid === workspaceId && p === provider && isRecent;
  } catch {
    return false;
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  getComposioApps,
  connectComposioApp,
  disconnectComposioApp,
  connectComposioIntegration,
  connectMCPIntegration,
  testMCPConnection,
  createAPIIntegration,
  createAPIEndpoint,
  getAPIEndpoints,
  updateAPIEndpoint,
  deleteAPIEndpoint,
  listIntegrationTools,
  callTool,
  checkIntegrationStatus,
  recheckIntegrations,
  startComposioOAuth,
  handleComposioOAuthCallback,
};
