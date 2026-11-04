/**
 * SavvyBot Knowledge System
 * 
 * Sistema de conocimiento para agentes de IA que combina:
 * - Memoria (hechos y contexto persistente)
 * - Skills (capacidades y procedimientos)
 * - Contexto de la conversación
 * - Conocimiento del workspace
 * 
 * Este módulo permite a los agentes "recordar", "aprender" y "aplicar"
 * conocimiento de forma contextual.
 */

import { db } from "../db";
import { memories, skills, agents, workspaces, threads, messages } from "../db/schema";
import { eq, and, or, desc, like, sql } from "drizzle-orm";
import { Agent, Memory, Skill } from "../../types";

// ============================================
// TIPOS
// ============================================

export interface KnowledgeContext {
  // Contexto de la conversación
  conversation: {
    threadId: string;
    messages: Array<{
      id: string;
      authorType: string;
      authorId: string;
      content: string;
      createdAt: Date;
    }>;
    currentQuery: string;
  };
  
  // Contexto del agente
  agent: {
    id: string;
    name: string;
    role: string;
    personality: string;
    instructions: string;
    autonomy: number;
  };
  
  // Contexto del workspace
  workspace: {
    id: string;
    name: string;
    timezone: string;
    language: string;
  };
  
  // Memoria relevante
  memories: Memory[];
  
  // Skills relevantes
  skills: Skill[];
  
  // Conocimiento derivado
  derived: {
    userIntent: string;
    relevantFacts: string[];
    suggestedActions: string[];
    confidence: number;
  };
}

export interface KnowledgeSearchResult {
  type: "memory" | "skill" | "conversation" | "workspace";
  id: string;
  content: string;
  relevance: number;
  source: string;
  createdAt: Date;
  metadata?: any;
}

export interface KnowledgeResponse {
  context: KnowledgeContext;
  searchResults: KnowledgeSearchResult[];
  summary: string;
  recommendations: string[];
}

// ============================================
// SISTEMA DE CONOCIMIENTO PRINCIPAL
// ============================================

/**
 * Clase principal del sistema de conocimiento
 */
export class KnowledgeSystem {
  private workspaceId: string;
  private agentId: string;
  
  constructor(workspaceId: string, agentId: string) {
    this.workspaceId = workspaceId;
    this.agentId = agentId;
  }
  
  /**
   * Obtener contexto de conocimiento completo para un agente
   */
  async getContext(threadId: string, currentQuery: string): Promise<KnowledgeContext> {
    // Obtener agente
    const agent = await this.getAgent();
    
    // Obtener workspace
    const workspace = await this.getWorkspace();
    
    // Obtener conversación
    const conversation = await this.getConversation(threadId, currentQuery);
    
    // Obtener memorias relevantes
    const memories = await this.searchMemories(currentQuery, threadId);
    
    // Obtener skills relevantes
    const skills = await this.searchSkills(currentQuery);
    
    // Derivar conocimiento
    const derived = this.deriveKnowledge({
      agent,
      workspace,
      conversation,
      memories,
      skills,
      currentQuery,
    });
    
    return {
      conversation,
      agent,
      workspace,
      memories,
      skills,
      derived,
    };
  }
  
  /**
   * Buscar conocimiento relevante para una consulta
   */
  async search(query: string, threadId?: string, limit: number = 10): Promise<KnowledgeSearchResult[]> {
    const results: KnowledgeSearchResult[] = [];
    
    // Buscar en memorias
    const memories = await this.searchMemories(query, threadId);
    memories.forEach((m) => {
      results.push({
        type: "memory",
        id: m.id,
        content: m.text,
        relevance: this.calculateRelevance(query, m.text, "memory"),
        source: `memory:${m.scope}`,
        createdAt: m.createdAt,
        metadata: { scope: m.scope, type: m.type },
      });
    });
    
    // Buscar en skills
    const skills = await this.searchSkills(query);
    skills.forEach((s) => {
      results.push({
        type: "skill",
        id: s.id,
        content: `${s.name}: ${s.goal}. Pasos: ${s.steps?.join(", ")}`,
        relevance: this.calculateRelevance(query, `${s.name} ${s.goal} ${s.steps?.join(" ")}`, "skill"),
        source: "skill",
        createdAt: s.createdAt,
        metadata: { name: s.name, goal: s.goal },
      });
    });
    
    // Buscar en conversación
    if (threadId) {
      const conversation = await this.getConversation(threadId, query);
      conversation.messages.slice(-20).forEach((msg) => {
        if (msg.authorType !== "system") {
          results.push({
            type: "conversation",
            id: msg.id,
            content: msg.content,
            relevance: this.calculateRelevance(query, msg.content, "conversation"),
            source: `conversation:${msg.authorType}`,
            createdAt: msg.createdAt,
            metadata: { authorType: msg.authorType },
          });
        }
      });
    }
    
    // Buscar en conocimiento del workspace
    const workspaceInfo = await this.getWorkspaceInfo();
    if (workspaceInfo) {
      results.push({
        type: "workspace",
        id: this.workspaceId,
        content: `Workspace: ${workspaceInfo.name}. Plan: ${workspaceInfo.plan}. Zona horaria: ${workspaceInfo.timezone}`,
        relevance: this.calculateRelevance(query, JSON.stringify(workspaceInfo), "workspace"),
        source: "workspace",
        createdAt: new Date(),
        metadata: workspaceInfo,
      });
    }
    
    // Ordenar por relevancia
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }
  
  /**
   * Obtener resumen de conocimiento para el prompt del LLM
   */
  async getKnowledgePrompt(query: string, threadId: string, maxLength: number = 4000): Promise<string> {
    const context = await this.getContext(threadId, query);
    
    // Formatear el prompt
    let prompt = "\n\n--- CONOCIMIENTO ---\n\n";
    
    // Memorias
    if (context.memories.length > 0) {
      prompt += "[MEMORIA]\n";
      context.memories.forEach((m) => {
        prompt += `- ${m.text}\n`;
      });
      prompt += "\n";
    }
    
    // Skills
    if (context.skills.length > 0) {
      prompt += "[HABILIDADES]\n";
      context.skills.forEach((s) => {
        prompt += `- ${s.name}: ${s.goal}\n`;
        if (s.steps) {
          prompt += `  Pasos: ${s.steps.join(", ")}\n`;
        }
      });
      prompt += "\n";
    }
    
    // Contexto de la conversación
    if (context.conversation.messages.length > 0) {
      prompt += "[CONTEXTO DE CONVERSACIÓN]\n";
      context.conversation.messages.slice(-5).forEach((msg) => {
        const author = msg.authorType === "user" ? "Usuario" : context.agent.name;
        prompt += `- ${author}: ${msg.content}\n`;
      });
      prompt += "\n";
    }
    
    // Información del workspace
    prompt += `[WORKSPACE]\n`;
    prompt += `- Nombre: ${context.workspace.name}\n`;
    prompt += `- Zona horaria: ${context.workspace.timezone}\n`;
    prompt += `- Idioma: ${context.workspace.language}\n`;
    
    // Derivado
    if (context.derived.userIntent) {
      prompt += `\n[INTENCIÓN DETECTADA]\n`;
      prompt += `- Intención: ${context.derived.userIntent}\n`;
      prompt += `- Hechos relevantes: ${context.derived.relevantFacts.join(", ")}\n`;
      prompt += `- Acciones sugeridas: ${context.derived.suggestedActions.join(", "))\n`;
    }
    
    // Truncar si es muy largo
    if (prompt.length > maxLength) {
      prompt = prompt.slice(0, maxLength - 100) + "\n\n... (conocimiento truncado)";
    }
    
    return prompt;
  }
  
  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================
  
  private async getAgent(): Promise<Agent> {
    const [agent] = await db
      .select({
        id: agents.id,
        name: agents.name,
        role: agents.role,
        personality: agents.personality,
        instructions: agents.instructions,
        autonomy: agents.autonomy,
      })
      .from(agents)
      .where(and(
        eq(agents.id, this.agentId),
        eq(agents.workspaceId, this.workspaceId)
      ))
      .limit(1);
    
    if (!agent) {
      throw new Error(`Agent ${this.agentId} not found in workspace ${this.workspaceId}`);
    }
    
    return agent as Agent;
  }
  
  private async getWorkspace() {
    const [workspace] = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        timezone: workspaces.timezone,
        language: workspaces.language,
      })
      .from(workspaces)
      .where(eq(workspaces.id, this.workspaceId))
      .limit(1);
    
    if (!workspace) {
      throw new Error(`Workspace ${this.workspaceId} not found`);
    }
    
    return workspace;
  }
  
  private async getWorkspaceInfo() {
    const [workspace] = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        plan: workspaces.plan,
        timezone: workspaces.timezone,
        language: workspaces.language,
        billingEnabled: workspaces.billingEnabled,
        createdAt: workspaces.createdAt,
      })
      .from(workspaces)
      .where(eq(workspaces.id, this.workspaceId))
      .limit(1);
    
    return workspace || null;
  }
  
  private async getConversation(threadId: string, currentQuery: string) {
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
      .orderBy(desc(messages.createdAt));
    
    return {
      threadId,
      messages: threadMessages.reverse(), // Oldest first
      currentQuery,
    };
  }
  
  private async searchMemories(query: string, threadId?: string): Promise<Memory[]> {
    // Buscar memorias globales del workspace
    const globalMemories = await db
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
        eq(memories.workspaceId, this.workspaceId),
        or(
          eq(memories.scope, "global"),
          and(
            eq(memories.scope, "agent"),
            eq(memories.agentId, this.agentId)
          ),
          and(
            eq(memories.scope, "thread"),
            threadId ? eq(memories.sourceThreadId, threadId) : undefined
          ).filter(Boolean) as any
        ),
        like(memories.text, `%${query}%`)
      ))
      .orderBy(desc(memories.createdAt))
      .limit(20);
    
    return globalMemories as Memory[];
  }
  
  private async searchSkills(query: string): Promise<Skill[]> {
    const skills = await db
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
        eq(skills.agentId, this.agentId),
        or(
          like(skills.name, `%${query}%`),
          like(skills.goal, `%${query}%`),
          like(sql`${skills.steps}::text`, `%${query}%`)
        )
      ))
      .orderBy(desc(skills.usageCount))
      .limit(10);
    
    return skills as Skill[];
  }
  
  private calculateRelevance(query: string, content: string, type: string): number {
    // Implementación simple de cálculo de relevancia
    // En producción, usar TF-IDF o embeddings
    
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Contar coincidencias
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    const contentWords = contentLower.split(/\s+/);
    
    let matches = 0;
    for (const word of queryWords) {
      if (contentWords.includes(word)) {
        matches++;
      }
    }
    
    // Ponderación por tipo
    const typeWeight = {
      memory: 1.0,
      skill: 1.2,
      conversation: 0.8,
      workspace: 0.5,
    };
    
    // Ponderación por longitud
    const lengthFactor = 1 - Math.min(0.5, content.length / 1000);
    
    // Calcular relevancia (0-1)
    const relevance = Math.min(1, (
      (matches / Math.max(1, queryWords.length)) * 0.6 +
      (typeWeight[type] || 1.0) * 0.2 +
      lengthFactor * 0.2
    ));
    
    return relevance;
  }
  
  private deriveKnowledge(context: {
    agent: Agent;
    workspace: any;
    conversation: any;
    memories: Memory[];
    skills: Skill[];
    currentQuery: string;
  }): KnowledgeContext["derived"] {
    // Analizar intención del usuario
    const userIntent = this.analyzeIntent(context.currentQuery, context.conversation.messages);
    
    // Extraer hechos relevantes
    const relevantFacts = this.extractFacts(context.memories, context.conversation.messages);
    
    // Sugerir acciones
    const suggestedActions = this.suggestActions(
      context.currentQuery,
      context.skills,
      context.agent.autonomy,
      userIntent
    );
    
    // Calcular confianza
    const confidence = this.calculateConfidence(
      context.memories.length,
      context.skills.length,
      context.conversation.messages.length
    );
    
    return {
      userIntent,
      relevantFacts,
      suggestedActions,
      confidence,
    };
  }
  
  private analyzeIntent(query: string, messages: any[]): string {
    // Implementación simple de análisis de intención
    // En producción, usar un modelo de clasificación
    
    const queryLower = query.toLowerCase();
    
    // Patrones de intención
    const patterns: Record<string, string[]> = {
      "crear": ["crear", "nuevo", "hacer", "construir", "generar"],
      "buscar": ["buscar", "encontrar", "localizar", "¿dónde", "¿cuál"],
      "listar": ["listar", "mostrar", "ver", "¿qué", "todos"],
      "actualizar": ["actualizar", "modificar", "cambiar", "editar"],
      "eliminar": ["eliminar", "borrar", "remover", "quitar"],
      "explicar": ["explicar", "¿cómo", "¿por qué", "describir"],
      "ayuda": ["ayuda", "soporte", "problema", "error"],
      "aprender": ["aprender", "recordar", "guardar", "memoria"],
      "ejecutar": ["ejecutar", "hacer", "realizar", "procesar"],
      "aprobar": ["aprobar", "aceptar", "confirmar", "sí"],
      "rechazar": ["rechazar", "denegar", "no", "cancelar"],
    };
    
    for (const [intent, keywords] of Object.entries(patterns)) {
      for (const keyword of keywords) {
        if (queryLower.includes(keyword)) {
          return intent;
        }
      }
    }
    
    // Analizar mensajes anteriores para contexto
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1].content.toLowerCase();
      for (const [intent, keywords] of Object.entries(patterns)) {
        for (const keyword of keywords) {
          if (lastMessage.includes(keyword)) {
            return intent;
          }
        }
      }
    }
    
    return "general";
  }
  
  private extractFacts(memories: Memory[], messages: any[]): string[] {
    const facts: string[] = [];
    
    // Extraer de memorias
    memories.forEach((m) => {
      if (m.type === "fact") {
        facts.push(m.text);
      }
    });
    
    // Extraer de mensajes (hechos explícitos)
    messages.forEach((msg) => {
      const contentLower = msg.content.toLowerCase();
      
      // Patrones de hechos
      if (contentLower.includes("el hecho es que") ||
          contentLower.includes("es importante que") ||
          contentLower.includes("recuerda que")) {
        facts.push(msg.content);
      }
    });
    
    return [...new Set(facts)].slice(0, 5);
  }
  
  private suggestActions(
    query: string,
    skills: Skill[],
    autonomy: number,
    intent: string
  ): string[] {
    const actions: string[] = [];
    
    // Basado en intención
    switch (intent) {
      case "crear":
        actions.push("Crear nuevo elemento");
        break;
      case "buscar":
        actions.push("Buscar información relevante");
        break;
      case "listar":
        actions.push("Listar elementos existentes");
        break;
      case "actualizar":
        actions.push("Actualizar elemento existente");
        break;
      case "eliminar":
        if (autonomy >= 3) {
          actions.push("Eliminar elemento (requiere aprobación)");
        } else {
          actions.push("Solicitar aprobación para eliminar");
        }
        break;
      case "explicar":
        actions.push("Proporcionar explicación detallada");
        break;
      case "ayuda":
        actions.push("Ofrecer asistencia");
        break;
      case "aprender":
        actions.push("Guardar en memoria");
        break;
      case "ejecutar":
        actions.push("Ejecutar tarea");
        break;
    }
    
    // Basado en skills
    skills.slice(0, 3).forEach((skill) => {
      actions.push(`Usar skill: ${skill.name}`);
    });
    
    // Basado en autonomía
    if (autonomy >= 2) {
      actions.push("Tomar decisión autónoma");
    }
    
    return [...new Set(actions)].slice(0, 5);
  }
  
  private calculateConfidence(
    memoryCount: number,
    skillCount: number,
    messageCount: number
  ): number {
    // Calcular confianza basada en disponibilidad de conocimiento
    const memoryScore = Math.min(1, memoryCount / 10);
    const skillScore = Math.min(1, skillCount / 5);
    const contextScore = Math.min(1, messageCount / 20);
    
    return Math.round((memoryScore * 0.4 + skillScore * 0.3 + contextScore * 0.3) * 100);
  }
}

// ============================================
// FUNCIONES DE ALTO NIVEL
// ============================================

/**
 * Obtener sistema de conocimiento para un agente
 */
export function getKnowledgeSystem(workspaceId: string, agentId: string): KnowledgeSystem {
  return new KnowledgeSystem(workspaceId, agentId);
}

/**
 * Buscar conocimiento rápidamente
 */
export async function searchKnowledge(
  workspaceId: string,
  agentId: string,
  query: string,
  threadId?: string,
  limit: number = 10
): Promise<KnowledgeSearchResult[]> {
  const knowledge = getKnowledgeSystem(workspaceId, agentId);
  return await knowledge.search(query, threadId, limit);
}

/**
 * Obtener prompt de conocimiento para LLM
 */
export async function getKnowledgePrompt(
  workspaceId: string,
  agentId: string,
  query: string,
  threadId: string,
  maxLength: number = 4000
): Promise<string> {
  const knowledge = getKnowledgeSystem(workspaceId, agentId);
  return await knowledge.getKnowledgePrompt(query, threadId, maxLength);
}

/**
 * Obtener contexto completo de conocimiento
 */
export async function getKnowledgeContext(
  workspaceId: string,
  agentId: string,
  threadId: string,
  currentQuery: string
): Promise<KnowledgeContext> {
  const knowledge = getKnowledgeSystem(workspaceId, agentId);
  return await knowledge.getContext(threadId, currentQuery);
}

// ============================================
// FUNCIONES DE APRENDIZAJE
// ============================================

/**
 * Añadir conocimiento desde una conversación
 */
export async function learnFromConversation(
  workspaceId: string,
  agentId: string,
  threadId: string,
  messageId: string,
  type: "fact" | "note" | "instruction" = "note"
): Promise<Memory> {
  // Obtener el mensaje
  const [message] = await db
    .select({ content: messages.content })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);
  
  if (!message) {
    throw new Error(`Message ${messageId} not found`);
  }
  
  // Crear memoria
  const [memory] = await db
    .insert(memories)
    .values({
      workspaceId,
      agentId: type === "agent" ? agentId : null,
      scope: type === "global" ? "global" : "agent",
      type,
      text: message.content,
      sourceThreadId: threadId,
      sourceMessageId: messageId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  
  return memory as Memory;
}

/**
 * Aprender de una interacción
 */
export async function learnFromInteraction(
  workspaceId: string,
  agentId: string,
  data: {
    question: string;
    answer: string;
    type?: "fact" | "note" | "instruction";
    scope?: "global" | "agent";
  }
): Promise<Memory> {
  const { question, answer, type = "note", scope = "agent" } = data;
  
  // Crear texto de memoria
  const text = `P: ${question}\nR: ${answer}`;
  
  const [memory] = await db
    .insert(memories)
    .values({
      workspaceId,
      agentId: scope === "agent" ? agentId : null,
      scope,
      type,
      text,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  
  return memory as Memory;
}

/**
 * Convertir trabajo en skill
 */
export async function createSkillFromWork(
  agentId: string,
  workspaceId: string,
  data: {
    name: string;
    goal: string;
    steps: string[];
    inputs?: Record<string, string>;
    outputs?: Record<string, string>;
    knownErrors?: string[];
  }
): Promise<Skill> {
  const [skill] = await db
    .insert(skills)
    .values({
      agentId,
      name: data.name,
      goal: data.goal,
      steps: data.steps,
      inputs: data.inputs || {},
      outputs: data.outputs || {},
      knownErrors: data.knownErrors || [],
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  
  return skill as Skill;
}

// ============================================
// FUNCIONES DE CONTEXTO
// ============================================

/**
 * Obtener contexto para el sistema de agentes
 */
export async function getAgentKnowledgeContext(
  workspaceId: string,
  agentId: string,
  threadId: string,
  userMessage: string
): Promise<string> {
  const knowledge = getKnowledgeSystem(workspaceId, agentId);
  const prompt = await knowledge.getKnowledgePrompt(userMessage, threadId);
  return prompt;
}

// ============================================
// EXPORTACIONES
// ============================================

export {
  KnowledgeSystem,
  KnowledgeContext,
  KnowledgeSearchResult,
  KnowledgeResponse,
};
