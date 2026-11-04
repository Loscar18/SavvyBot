import { db } from "../db";
import { agents, workspaces, threads, messages, memories, skills, toolPermissions, integrations, apiEndpoints, approvals, jobs, jobSteps } from "../db/schema";
import { eq, and, or, desc, like, sql } from "drizzle-orm";
import { decrypt, encrypt } from "../crypto";
import { queueToolCall, queueAgentTurn } from "../queue";
import { getIntegrationById, listIntegrationTools } from "../integrations";
import { createApproval } from "./approvals";

// Agent types
export interface Agent {
  id: string;
  workspaceId: string;
  name: string;
  emoji: string | null;
  color: string;
  role: string;
  personality: string | null;
  instructions: string | null;
  autonomy: number;
  modelBaseUrl: string | null;
  modelName: string;
  modelKeyCiphertext: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentContext {
  workspaceId: string;
  agent: Agent;
  threadId: string;
  userMessage: string;
  jobId: string;
  messages: any[];
  memories: any[];
  skills: any[];
  availableTools: any[];
  toolPermissions: Record<string, string>;
}

// Default system prompt template
export const DEFAULT_SYSTEM_PROMPT = `
Eres {{name}}, agente de IA siempre activo de {{owner}}.
Rol: {{role}}.
Trabajas como un compañero, no como un chat: las tareas se llevan de principio a fin
con tus herramientas reales y vuelves solo con el trabajo hecho o cuando hace falta
una decisión humana.
- Español, tono cercano y directo, sin paja.
- Consulta memoria y skills antes de cada tarea.
- Autonomía: nivel {{autonomy}}. Ante la duda, el nivel más restrictivo.
- Efectos externos/irreversibles (enviar/publicar/comprar/borrar): SIEMPRE aprobación.
- Entrega: resultado + qué hiciste + qué verificaste + siguiente paso.
- Honestidad radical: no inventas éxito ni datos.
`;

// ============================================
// AGENT CRUD
// ============================================

/**
 * Create a new agent
 */
export async function createAgent(
  workspaceId: string,
  data: {
    name: string;
    emoji?: string;
    color?: string;
    role: string;
    personality?: string;
    instructions?: string;
    autonomy?: number;
    modelBaseUrl?: string;
    modelName?: string;
    modelKey?: string;
  }
): Promise<Agent> {
  // Encrypt the API key if provided
  let modelKeyCiphertext: string | null = null;
  if (data.modelKey) {
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    modelKeyCiphertext = encrypt(data.modelKey, encryptionKey);
  }

  // Generate default instructions if not provided
  const instructions = data.instructions || 
    DEFAULT_SYSTEM_PROMPT
      .replace("{{name}}", data.name)
      .replace("{{role}}", data.role)
      .replace("{{autonomy}}", data.autonomy?.toString() || "2");

  const [agent] = await db
    .insert(agents)
    .values({
      workspaceId,
      name: data.name,
      emoji: data.emoji || "🤖",
      color: data.color || "#FF7A29",
      role: data.role,
      personality: data.personality,
      instructions,
      autonomy: data.autonomy || 2,
      modelBaseUrl: data.modelBaseUrl,
      modelName: data.modelName || "grok",
      modelKeyCiphertext,
      status: "active",
    })
    .returning({
      id: agents.id,
      workspaceId: agents.workspaceId,
      name: agents.name,
      emoji: agents.emoji,
      color: agents.color,
      role: agents.role,
      personality: agents.personality,
      instructions: agents.instructions,
      autonomy: agents.autonomy,
      modelBaseUrl: agents.modelBaseUrl,
      modelName: agents.modelName,
      modelKeyCiphertext: agents.modelKeyCiphertext,
      status: agents.status,
      createdAt: agents.createdAt,
      updatedAt: agents.updatedAt,
    });

  return agent;
}

/**
 * Get agent by ID
 */
export async function getAgentById(agentId: string, workspaceId: string): Promise<Agent | null> {
  const [agent] = await db
    .select({
      id: agents.id,
      workspaceId: agents.workspaceId,
      name: agents.name,
      emoji: agents.emoji,
      color: agents.color,
      role: agents.role,
      personality: agents.personality,
      instructions: agents.instructions,
      autonomy: agents.autonomy,
      modelBaseUrl: agents.modelBaseUrl,
      modelName: agents.modelName,
      modelKeyCiphertext: agents.modelKeyCiphertext,
      status: agents.status,
      createdAt: agents.createdAt,
      updatedAt: agents.updatedAt,
    })
    .from(agents)
    .where(and(
      eq(agents.id, agentId),
      eq(agents.workspaceId, workspaceId)
    ))
    .limit(1);

  return agent || null;
}

/**
 * Get all agents for a workspace
 */
export async function getAgentsByWorkspace(workspaceId: string): Promise<Agent[]> {
  return await db
    .select({
      id: agents.id,
      workspaceId: agents.workspaceId,
      name: agents.name,
      emoji: agents.emoji,
      color: agents.color,
      role: agents.role,
      personality: agents.personality,
      instructions: agents.instructions,
      autonomy: agents.autonomy,
      modelBaseUrl: agents.modelBaseUrl,
      modelName: agents.modelName,
      modelKeyCiphertext: agents.modelKeyCiphertext,
      status: agents.status,
      createdAt: agents.createdAt,
      updatedAt: agents.updatedAt,
    })
    .from(agents)
    .where(eq(agents.workspaceId, workspaceId))
    .orderBy(desc(agents.createdAt));
}

/**
 * Update an agent
 */
export async function updateAgent(
  agentId: string,
  workspaceId: string,
  data: {
    name?: string;
    emoji?: string;
    color?: string;
    role?: string;
    personality?: string;
    instructions?: string;
    autonomy?: number;
    modelBaseUrl?: string;
    modelName?: string;
    modelKey?: string;
    status?: string;
  }
): Promise<Agent | null> {
  // Get existing agent to preserve encrypted key
  const existingAgent = await getAgentById(agentId, workspaceId);
  if (!existingAgent) {
    return null;
  }

  // Only encrypt new key if provided
  let modelKeyCiphertext = existingAgent.modelKeyCiphertext;
  if (data.modelKey) {
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    modelKeyCiphertext = encrypt(data.modelKey, encryptionKey);
  }

  const [agent] = await db
    .update(agents)
    .set({
      name: data.name,
      emoji: data.emoji,
      color: data.color,
      role: data.role,
      personality: data.personality,
      instructions: data.instructions,
      autonomy: data.autonomy,
      modelBaseUrl: data.modelBaseUrl,
      modelName: data.modelName,
      modelKeyCiphertext,
      status: data.status,
      updatedAt: new Date(),
    })
    .where(and(
      eq(agents.id, agentId),
      eq(agents.workspaceId, workspaceId)
    ))
    .returning({
      id: agents.id,
      workspaceId: agents.workspaceId,
      name: agents.name,
      emoji: agents.emoji,
      color: agents.color,
      role: agents.role,
      personality: agents.personality,
      instructions: agents.instructions,
      autonomy: agents.autonomy,
      modelBaseUrl: agents.modelBaseUrl,
      modelName: agents.modelName,
      modelKeyCiphertext: agents.modelKeyCiphertext,
      status: agents.status,
      createdAt: agents.createdAt,
      updatedAt: agents.updatedAt,
    });

  return agent;
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string, workspaceId: string): Promise<boolean> {
  const [result] = await db
    .delete(agents)
    .where(and(
      eq(agents.id, agentId),
      eq(agents.workspaceId, workspaceId)
    ))
    .returning({ id: agents.id });

  return !!result;
}

/**
 * Toggle agent status
 */
export async function toggleAgentStatus(agentId: string, workspaceId: string): Promise<Agent | null> {
  const [agent] = await db
    .select({
      id: agents.id,
      workspaceId: agents.workspaceId,
      status: agents.status,
    })
    .from(agents)
    .where(and(
      eq(agents.id, agentId),
      eq(agents.workspaceId, workspaceId)
    ))
    .limit(1);

  if (!agent) {
    return null;
  }

  const newStatus = agent.status === "active" ? "paused" : "active";

  const [updated] = await db
    .update(agents)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(and(
      eq(agents.id, agentId),
      eq(agents.workspaceId, workspaceId)
    ))
    .returning({
      id: agents.id,
      workspaceId: agents.workspaceId,
      name: agents.name,
      emoji: agents.emoji,
      color: agents.color,
      role: agents.role,
      personality: agents.personality,
      instructions: agents.instructions,
      autonomy: agents.autonomy,
      modelBaseUrl: agents.modelBaseUrl,
      modelName: agents.modelName,
      modelKeyCiphertext: agents.modelKeyCiphertext,
      status: agents.status,
      createdAt: agents.createdAt,
      updatedAt: agents.updatedAt,
    });

  return updated;
}

// ============================================
// AGENT CONTEXT CREATION
// ============================================

/**
 * Create context for agent execution
 */
export async function createAgentContext(
  workspaceId: string,
  agentId: string,
  threadId: string,
  userMessage: string,
  jobId: string
): Promise<AgentContext> {
  // Get agent
  const agent = await getAgentById(agentId, workspaceId);
  if (!agent) {
    throw new Error("Agent not found");
  }

  // Get workspace
  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      timezone: workspaces.timezone,
      language: workspaces.language,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Get thread messages
  const threadMessages = await db
    .select({
      id: messages.id,
      authorType: messages.authorType,
      authorId: messages.authorId,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(desc(messages.createdAt))
    .limit(50);

  // Get agent memories
  const agentMemories = await db
    .select({
      id: memories.id,
      scope: memories.scope,
      type: memories.type,
      text: memories.text,
      createdAt: memories.createdAt,
    })
    .from(memories)
    .where(or(
      and(
        eq(memories.workspaceId, workspaceId),
        eq(memories.agentId, agentId)
      ),
      and(
        eq(memories.workspaceId, workspaceId),
        eq(memories.scope, "global")
      )
    ))
    .orderBy(desc(memories.createdAt))
    .limit(100);

  // Get agent skills
  const agentSkills = await db
    .select({
      id: skills.id,
      name: skills.name,
      goal: skills.goal,
      steps: skills.steps,
      inputs: skills.inputs,
      outputs: skills.outputs,
      knownErrors: skills.knownErrors,
    })
    .from(skills)
    .where(eq(skills.agentId, agentId))
    .orderBy(desc(skills.createdAt));

  // Get available tools and permissions
  const integrationsList = await db
    .select({
      id: integrations.id,
      kind: integrations.kind,
      providerName: integrations.providerName,
      status: integrations.status,
      configCiphertext: integrations.configCiphertext,
    })
    .from(integrations)
    .where(eq(integrations.workspaceId, workspaceId));

  const availableTools: any[] = [];
  const toolPermissionsMap: Record<string, string> = {};

  for (const integration of integrationsList) {
    if (integration.status !== "connected") {
      continue;
    }

    const tools = await listIntegrationTools(integration.id);
    for (const tool of tools) {
      const [permission] = await db
        .select({
          scope: toolPermissions.scope,
        })
        .from(toolPermissions)
        .where(and(
          eq(toolPermissions.agentId, agentId),
          eq(toolPermissions.integrationId, integration.id),
          eq(toolPermissions.toolName, tool.name)
        ))
        .limit(1);

      const scope = permission?.scope || "read";
      toolPermissionsMap[`${integration.id}:${tool.name}`] = scope;

      if (scope !== "blocked") {
        availableTools.push({
          ...tool,
          integrationId: integration.id,
          integrationKind: integration.kind,
          integrationName: integration.providerName,
          permission: scope,
        });
      }
    }
  }

  // Get agent's default model key
  let modelKey: string | null = null;
  if (agent.modelKeyCiphertext) {
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    modelKey = decrypt(agent.modelKeyCiphertext, encryptionKey);
  }

  return {
    workspaceId,
    agent: {
      ...agent,
      modelKey, // Add decrypted key to context (only used server-side)
    },
    threadId,
    userMessage,
    jobId,
    messages: threadMessages,
    memories: agentMemories,
    skills: agentSkills,
    availableTools,
    toolPermissions: toolPermissionsMap,
  };
}

// ============================================
// AGENT EXECUTION
// ============================================

/**
 * Execute an agent turn
 */
export async function executeAgentTurn(context: AgentContext): Promise<any> {
  const {
    workspaceId,
    agent,
    threadId,
    userMessage,
    jobId,
    messages,
    memories,
    skills,
    availableTools,
    toolPermissions,
  } = context;

  // Record job step
  await db.insert(jobSteps).values({
    jobId,
    stepNumber: 1,
    type: "think",
    action: "Processing user message",
    status: "completed",
  });

  // Build system prompt
  const systemPrompt = buildSystemPrompt(agent, workspaceId);

  // Build conversation history
  const history = buildConversationHistory(messages);

  // Build tools for LLM
  const toolsForLLM = buildToolsForLLM(availableTools, toolPermissions);

  // Build memory context
  const memoryContext = buildMemoryContext(memories);

  // Build skills context
  const skillsContext = buildSkillsContext(skills);

  // Prepare the full prompt
  const fullPrompt = `
${systemPrompt}

${memoryContext}

${skillsContext}

${history}

${userMessage}
`;

  // Check autonomy level
  const canExecuteWithoutApproval = agent.autonomy >= 3;

  // For now, simulate LLM response
  // In production, this would call the actual LLM API
  const llmResponse = await simulateLLMCall({
    model: agent.modelName,
    baseUrl: agent.modelBaseUrl,
    apiKey: agent.modelKey,
    prompt: fullPrompt,
    tools: toolsForLLM,
    maxSteps: 15,
    autonomy: agent.autonomy,
  });

  // Process the response
  const result = await processAgentResponse({
    workspaceId,
    agent,
    threadId,
    userMessage,
    llmResponse,
    availableTools,
    toolPermissions,
    jobId,
    canExecuteWithoutApproval,
  });

  return result;
}

/**
 * Build system prompt for agent
 */
function buildSystemPrompt(agent: any, workspaceId: string): string {
  // Get workspace owner name
  let ownerName = "el usuario";
  
  // In production, we'd fetch this from the database
  // For now, use a placeholder
  
  return DEFAULT_SYSTEM_PROMPT
    .replace("{{name}}", agent.name)
    .replace("{{role}}", agent.role)
    .replace("{{owner}}", ownerName)
    .replace("{{autonomy}}", agent.autonomy.toString());
}

/**
 * Build conversation history
 */
function buildConversationHistory(messages: any[]): string {
  if (messages.length === 0) {
    return "";
  }

  return messages
    .reverse() // Oldest first
    .map((msg) => {
      const role = msg.authorType === "user" ? "Usuario" : msg.authorType === "agent" ? "Asistente" : "Sistema";
      return `${role}: ${msg.content}`;
    })
    .join("\n");
}

/**
 * Build memory context
 */
function buildMemoryContext(memories: any[]): string {
  if (memories.length === 0) {
    return "";
  }

  const globalMemories = memories.filter((m) => m.scope === "global");
  const agentMemories = memories.filter((m) => m.scope === "agent");

  let context = "\n\n--- MEMORIA ---\n";

  if (globalMemories.length > 0) {
    context += "\n[Memoria Global]\n";
    globalMemories.forEach((m) => {
      context += `- ${m.text}\n`;
    });
  }

  if (agentMemories.length > 0) {
    context += "\n[Memoria del Agente]\n";
    agentMemories.forEach((m) => {
      context += `- ${m.text}\n`;
    });
  }

  return context;
}

/**
 * Build skills context
 */
function buildSkillsContext(skills: any[]): string {
  if (skills.length === 0) {
    return "";
  }

  let context = "\n\n--- HABILIDADES ---\n";
  
  skills.forEach((skill) => {
    context += `\n[${skill.name}] ${skill.goal}\n`;
    context += `Pasos: ${skill.steps?.join(", ") || "Ninguno"}\n`;
    context += `Entradas: ${JSON.stringify(skill.inputs || {})}\n`;
    context += `Salidas: ${JSON.stringify(skill.outputs || {})}\n`;
    if (skill.knownErrors && skill.knownErrors.length > 0) {
      context += `Errores conocidos: ${skill.knownErrors.join(", ")}\n`;
    }
  });

  return context;
}

/**
 * Build tools for LLM
 */
function buildToolsForLLM(availableTools: any[], toolPermissions: Record<string, string>): any[] {
  return availableTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parametersSchema || {
      type: "object",
      properties: {},
    },
    permission: toolPermissions[`${tool.integrationId}:${tool.name}`],
  }));
}

/**
 * Simulate LLM call (placeholder for actual implementation)
 */
async function simulateLLMCall(params: {
  model: string;
  baseUrl?: string;
  apiKey?: string | null;
  prompt: string;
  tools: any[];
  maxSteps: number;
  autonomy: number;
}): Promise<any> {
  // In production, this would call the actual LLM API
  // For demo purposes, return a simulated response
  
  // Check if we have a valid API key
  if (!params.apiKey) {
    // Demo mode
    return {
      content: "(DEMO) Entiendo tu solicitud. Sin una clave de API configurada, estoy en modo demostración. Por favor, configura tu clave en Ajustes → Modelo para habilitar respuestas reales.",
      toolCalls: [],
    };
  }

  // Simulate a response based on the prompt
  return {
    content: "Entiendo tu solicitud. Voy a procesarla y ejecutar las acciones necesarias.",
    toolCalls: [],
  };
}

/**
 * Process agent response
 */
async function processAgentResponse(params: {
  workspaceId: string;
  agent: any;
  threadId: string;
  userMessage: string;
  llmResponse: any;
  availableTools: any[];
  toolPermissions: Record<string, string>;
  jobId: string;
  canExecuteWithoutApproval: boolean;
}): Promise<any> {
  const {
    workspaceId,
    agent,
    threadId,
    userMessage,
    llmResponse,
    availableTools,
    toolPermissions,
    jobId,
    canExecuteWithoutApproval,
  } = params;

  const result: any = {
    content: llmResponse.content,
    toolCalls: [],
    approvalsNeeded: [],
    completed: false,
  };

  // Process tool calls
  if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
    for (const toolCall of llmResponse.toolCalls) {
      const tool = availableTools.find((t) => t.name === toolCall.name);
      
      if (!tool) {
        console.warn(`Tool ${toolCall.name} not found`);
        continue;
      }

      const permissionKey = `${tool.integrationId}:${tool.name}`;
      const permission = toolPermissions[permissionKey] || "read";

      // Check if approval is needed
      const needsApproval = !canExecuteWithoutApproval && permission === "write_approval";
      const isIrreversible = isIrreversibleAction(tool.name);

      if (needsApproval || isIrreversible) {
        // Create approval request
        const approval = await createApproval({
          workspaceId,
          threadId,
          agentId: agent.id,
          toolName: tool.name,
          integrationId: tool.integrationId,
          payload: toolCall.arguments,
          jobId,
        });

        result.approvalsNeeded.push(approval);
      } else {
        // Queue tool call
        const job = await queueToolCall(
          workspaceId,
          agent.id,
          threadId,
          tool.name,
          tool.integrationId,
          toolCall.arguments,
          jobId
        );

        result.toolCalls.push({
          toolName: tool.name,
          jobId: job.id,
          status: "queued",
        });
      }
    }
  }

  // Save message to thread
  const [message] = await db
    .insert(messages)
    .values({
      threadId,
      authorType: "agent",
      authorId: agent.id,
      agentId: agent.id,
      content: llmResponse.content,
      modelUsed: agent.modelName,
      metadata: {
        toolCalls: result.toolCalls,
        approvalsNeeded: result.approvalsNeeded,
      },
    })
    .returning();

  result.messageId = message.id;
  result.completed = result.approvalsNeeded.length === 0;

  return result;
}

/**
 * Check if an action is irreversible
 */
function isIrreversibleAction(toolName: string): boolean {
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

  const lowerName = toolName.toLowerCase();
  return irreversiblePatterns.some((pattern) => lowerName.includes(pattern));
}

// ============================================
// AGENT MEMORY
// ============================================

/**
 * Add memory for an agent
 */
export async function addAgentMemory(
  workspaceId: string,
  agentId: string,
  text: string,
  type: "note" | "fact" | "instruction" = "note",
  scope: "global" | "agent" = "agent"
): Promise<any> {
  const [memory] = await db
    .insert(memories)
    .values({
      workspaceId,
      agentId: scope === "agent" ? agentId : null,
      scope,
      type,
      text,
    })
    .returning();

  return memory;
}

/**
 * Update memory
 */
export async function updateMemory(
  memoryId: string,
  workspaceId: string,
  text: string
): Promise<any> {
  const [memory] = await db
    .update(memories)
    .set({
      text,
      updatedAt: new Date(),
    })
    .where(and(
      eq(memories.id, memoryId),
      eq(memories.workspaceId, workspaceId)
    ))
    .returning();

  return memory;
}

/**
 * Delete memory
 */
export async function deleteMemory(memoryId: string, workspaceId: string): Promise<boolean> {
  const [result] = await db
    .delete(memories)
    .where(and(
      eq(memories.id, memoryId),
      eq(memories.workspaceId, workspaceId)
    ))
    .returning({ id: memories.id });

  return !!result;
}

/**
 * Get memories for workspace
 */
export async function getMemories(workspaceId: string, agentId?: string): Promise<any[]> {
  return await db
    .select({
      id: memories.id,
      workspaceId: memories.workspaceId,
      agentId: memories.agentId,
      scope: memories.scope,
      type: memories.type,
      text: memories.text,
      createdAt: memories.createdAt,
      updatedAt: memories.updatedAt,
    })
    .from(memories)
    .where(and(
      eq(memories.workspaceId, workspaceId),
      or(
        agentId ? eq(memories.agentId, agentId) : undefined,
        eq(memories.scope, "global"),
        and(
          !agentId,
          eq(memories.scope, "agent")
        )
      ).filter(Boolean) as any
    ))
    .orderBy(desc(memories.createdAt));
}

// ============================================
// AGENT SKILLS
// ============================================

/**
 * Create a skill for an agent
 */
export async function createSkill(
  agentId: string,
  workspaceId: string,
  data: {
    name: string;
    goal: string;
    steps?: string[];
    inputs?: Record<string, string>;
    outputs?: Record<string, string>;
    knownErrors?: string[];
  }
): Promise<any> {
  const [skill] = await db
    .insert(skills)
    .values({
      agentId,
      name: data.name,
      goal: data.goal,
      steps: data.steps || [],
      inputs: data.inputs || {},
      outputs: data.outputs || {},
      knownErrors: data.knownErrors || [],
    })
    .returning();

  return skill;
}

/**
 * Get skills for an agent
 */
export async function getSkillsByAgent(agentId: string, workspaceId: string): Promise<any[]> {
  return await db
    .select({
      id: skills.id,
      agentId: skills.agentId,
      name: skills.name,
      goal: skills.goal,
      steps: skills.steps,
      inputs: skills.inputs,
      outputs: skills.outputs,
      knownErrors: skills.knownErrors,
      lastUsedAt: skills.lastUsedAt,
      usageCount: skills.usageCount,
      createdAt: skills.createdAt,
      updatedAt: skills.updatedAt,
    })
    .from(skills)
    .where(and(
      eq(skills.agentId, agentId),
      eq(agents.workspaceId, workspaceId)
    ))
    .orderBy(desc(skills.createdAt));
}

/**
 * Update a skill
 */
export async function updateSkill(
  skillId: string,
  agentId: string,
  workspaceId: string,
  data: {
    name?: string;
    goal?: string;
    steps?: string[];
    inputs?: Record<string, string>;
    outputs?: Record<string, string>;
    knownErrors?: string[];
  }
): Promise<any> {
  const [skill] = await db
    .update(skills)
    .set({
      name: data.name,
      goal: data.goal,
      steps: data.steps,
      inputs: data.inputs,
      outputs: data.outputs,
      knownErrors: data.knownErrors,
      updatedAt: new Date(),
    })
    .where(and(
      eq(skills.id, skillId),
      eq(skills.agentId, agentId),
      eq(agents.workspaceId, workspaceId)
    ))
    .returning();

  return skill;
}

/**
 * Delete a skill
 */
export async function deleteSkill(skillId: string, agentId: string, workspaceId: string): Promise<boolean> {
  const [result] = await db
    .delete(skills)
    .where(and(
      eq(skills.id, skillId),
      eq(skills.agentId, agentId),
      eq(agents.workspaceId, workspaceId)
    ))
    .returning({ id: skills.id });

  return !!result;
}

// ============================================
// AGENT TOOL PERMISSIONS
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
export async function getToolPermissions(
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
        status: integrations.status,
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
export async function getAvailableTools(
  agentId: string,
  workspaceId: string
): Promise<any[]> {
  // Get all integrations for workspace
  const integrationsList = await db
    .select({
      id: integrations.id,
      kind: integrations.kind,
      providerName: integrations.providerName,
      status: integrations.status,
    })
    .from(integrations)
    .where(eq(integrations.workspaceId, workspaceId));

  const availableTools: any[] = [];

  for (const integration of integrationsList) {
    if (integration.status !== "connected") {
      continue;
    }

    const tools = await listIntegrationTools(integration.id);
    
    for (const tool of tools) {
      const [permission] = await db
        .select({
          scope: toolPermissions.scope,
        })
        .from(toolPermissions)
        .where(and(
          eq(toolPermissions.agentId, agentId),
          eq(toolPermissions.integrationId, integration.id),
          eq(toolPermissions.toolName, tool.name)
        ))
        .limit(1);

      const scope = permission?.scope || "read";
      
      if (scope !== "blocked") {
        availableTools.push({
          ...tool,
          integrationId: integration.id,
          integrationKind: integration.kind,
          integrationName: integration.providerName,
          permission: scope,
        });
      }
    }
  }

  return availableTools;
}

// ============================================
// AGENT STATUS
// ============================================

/**
 * Update agent status
 */
export async function updateAgentStatus(
  agentId: string,
  workspaceId: string,
  status: "active" | "paused" | "error",
  errorMessage?: string
): Promise<Agent | null> {
  const [agent] = await db
    .update(agents)
    .set({
      status,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(
      eq(agents.id, agentId),
      eq(agents.workspaceId, workspaceId)
    ))
    .returning({
      id: agents.id,
      workspaceId: agents.workspaceId,
      name: agents.name,
      emoji: agents.emoji,
      color: agents.color,
      role: agents.role,
      personality: agents.personality,
      instructions: agents.instructions,
      autonomy: agents.autonomy,
      modelBaseUrl: agents.modelBaseUrl,
      modelName: agents.modelName,
      modelKeyCiphertext: agents.modelKeyCiphertext,
      status: agents.status,
      createdAt: agents.createdAt,
      updatedAt: agents.updatedAt,
    });

  return agent;
}

/**
 * Get agent activity
 */
export async function getAgentActivity(
  agentId: string,
  workspaceId: string,
  limit: number = 20
): Promise<any[]> {
  return await db
    .select({
      id: jobs.id,
      type: jobs.type,
      status: jobs.status,
      createdAt: jobs.createdAt,
      completedAt: jobs.completedAt,
      error: jobs.error,
    })
    .from(jobs)
    .where(and(
      eq(jobs.agentId, agentId),
      eq(jobs.workspaceId, workspaceId)
    ))
    .orderBy(desc(jobs.createdAt))
    .limit(limit);
}

// ============================================
// EXPORTS
// ============================================

export {
  DEFAULT_SYSTEM_PROMPT,
  createAgent,
  getAgentById,
  getAgentsByWorkspace,
  updateAgent,
  deleteAgent,
  toggleAgentStatus,
  createAgentContext,
  executeAgentTurn,
  addAgentMemory,
  updateMemory,
  deleteMemory,
  getMemories,
  createSkill,
  getSkillsByAgent,
  updateSkill,
  deleteSkill,
  setToolPermission,
  getToolPermissions,
  getAvailableTools,
  updateAgentStatus,
  getAgentActivity,
};
