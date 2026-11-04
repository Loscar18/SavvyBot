import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { messages, threads, agents, approvals, jobs } from "../../../../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../../../../lib/auth";
import { encrypt, decrypt } from "../../../../lib/crypto";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// Zod schema for message input
const messageSchema = z.object({
  content: z.string().min(1, "El mensaje no puede estar vacío"),
  agentId: z.string().optional(),
  groupId: z.string().optional(),
  modelOverride: z.string().optional(),
});

// SSE response type
interface SSEMessage {
  type: "message" | "typing" | "approval" | "tool_call" | "error" | "complete";
  data: any;
  timestamp: number;
}

// Agent turn processor
class AgentTurnProcessor {
  private workspaceId: string;
  private threadId: string;
  private agentId: string;
  private userMessage: string;
  private model: string;
  private modelKey: string;
  private autonomy: number;
  private maxSteps: number = 15;
  private currentStep: number = 0;

  constructor(
    workspaceId: string,
    threadId: string,
    agentId: string,
    userMessage: string,
    model: string,
    modelKey: string,
    autonomy: number
  ) {
    this.workspaceId = workspaceId;
    this.threadId = threadId;
    this.agentId = agentId;
    this.userMessage = userMessage;
    this.model = model;
    this.modelKey = modelKey;
    this.autonomy = autonomy;
  }

  // Process turn and yield SSE messages
  async *process(): AsyncGenerator<SSEMessage> {
    try {
      // Step 1: Send typing indicator
      yield {
        type: "typing",
        data: { agentId: this.agentId },
        timestamp: Date.now(),
      };

      // Step 2: Get agent context
      const agentContext = await this.getAgentContext();

      // Step 3: Process with LLM
      const llmResponse = await this.callLLM(agentContext);

      // Step 4: Check for tool calls
      const toolCalls = this.parseToolCalls(llmResponse);

      if (toolCalls.length > 0) {
        // Step 5: Process tool calls
        for (const toolCall of toolCalls) {
          // Check autonomy level
          const requiresApproval = this.requiresApproval(toolCall);

          if (requiresApproval) {
            // Create approval
            const approvalId = uuidv4();
            yield {
              type: "approval",
              data: {
                id: approvalId,
                toolName: toolCall.name,
                payload: toolCall.arguments,
                agentId: this.agentId,
                threadId: this.threadId,
              },
              timestamp: Date.now(),
            };

            // Wait for approval (in a real implementation, this would be handled differently)
            break;
          } else {
            // Execute tool
            yield {
              type: "tool_call",
              data: {
                toolName: toolCall.name,
                payload: toolCall.arguments,
                status: "executing",
              },
              timestamp: Date.now(),
            };

            const toolResult = await this.executeTool(toolCall);

            yield {
              type: "tool_call",
              data: {
                toolName: toolCall.name,
                payload: toolResult,
                status: "completed",
              },
              timestamp: Date.now(),
            };
          }
        }
      }

      // Step 6: Send final message
      yield {
        type: "message",
        data: {
          content: llmResponse,
          agentId: this.agentId,
          modelUsed: this.model,
        },
        timestamp: Date.now(),
      };

      // Step 7: Complete
      yield {
        type: "complete",
        data: { threadId: this.threadId },
        timestamp: Date.now(),
      };
    } catch (error) {
      yield {
        type: "error",
        data: { error: error instanceof Error ? error.message : "Error desconocido" },
        timestamp: Date.now(),
      };
    }
  }

  private async getAgentContext(): Promise<string> {
    // Get agent info
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, this.agentId))
      .limit(1);

    if (!agent) {
      throw new Error("Agente no encontrado");
    }

    // Get thread messages for context
    const threadMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, this.threadId))
      .orderBy(messages.createdAt)
      .limit(20);

    // Build context
    const contextParts = [
      `Eres ${agent.name || "un agente de IA"}, ${agent.role || "asistente"}.`,
      `Tono: ${agent.personality || "profesional y amigable"}.`,
      `Instrucciones: ${agent.instructions || "Ayuda al usuario de la mejor manera posible."}`,
      `Nivel de autonomía: ${this.autonomy}`,
      "",
      "--- CONTEXTO DE LA CONVERSACIÓN ---",
      ...threadMessages.map((msg) => {
        const author = msg.authorType === "user" ? "Usuario" : agent.name || "Agente";
        return `${author}: ${msg.content}`;
      }),
      "",
      "--- NUEVO MENSAJE ---",
      `Usuario: ${this.userMessage}`,
    ];

    return contextParts.join("\n");
  }

  private async callLLM(context: string): Promise<string> {
    // In a real implementation, this would call the actual LLM API
    // For demo purposes, we'll simulate a response
    
    // Check if we have a model key
    if (!this.modelKey) {
      return "[DEMO] No tienes una clave de API configurada. Configura tu clave en Ajustes → Modelo para habilitar respuestas reales.";
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulate streaming response
    const responses = [
      "Entiendo tu solicitud. Déjame procesarla...",
      "Estoy analizando la información...",
      "En un momento tengo la respuesta para ti.",
      "He recibido tu mensaje y estoy trabajando en ello.",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  private parseToolCalls(response: string): { name: string; arguments: any }[] {
    // Parse tool calls from LLM response
    // This is a simplified version - in production, use proper function calling
    const toolCalls: { name: string; arguments: any }[] = [];
    
    // Look for tool call patterns
    const toolCallPattern = /<tool_call>\s*\{?\s*"name":\s*"([^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/tool_call>/gi;
    let match;
    
    while ((match = toolCallPattern.exec(response)) !== null) {
      try {
        const name = match[1];
        const argsStr = match[2];
        const args = argsStr ? JSON.parse(argsStr.replace(/\s+/g, " ").trim()) : {};
        toolCalls.push({ name, arguments: args });
      } catch (e) {
        console.error("Error parsing tool call:", e);
      }
    }

    return toolCalls;
  }

  private requiresApproval(toolCall: { name: string; arguments: any }): boolean {
    // Check autonomy level and tool type
    const irreversibleActions = [
      "send",
      "post",
      "publish",
      "buy",
      "purchase",
      "delete",
      "remove",
      "update",
      "modify",
      "write",
    ];

    const toolNameLower = toolCall.name.toLowerCase();
    const isIrreversible = irreversibleActions.some((action) =>
      toolNameLower.includes(action)
    );

    // N1: Always requires approval
    if (this.autonomy === 1) {
      return true;
    }

    // N2: Requires approval for irreversible actions
    if (this.autonomy === 2 && isIrreversible) {
      return true;
    }

    // N3: Only requires approval for purchases and deletions
    if (this.autonomy === 3) {
      const criticalActions = ["buy", "purchase", "delete", "remove"];
      return criticalActions.some((action) => toolNameLower.includes(action));
    }

    return false;
  }

  private async executeTool(toolCall: { name: string; arguments: any }): Promise<any> {
    // In a real implementation, this would call the actual tool
    // For demo purposes, simulate execution
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, result: `Herramienta ${toolCall.name} ejecutada correctamente` };
  }
}

// Main SSE handler
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    // Authenticate
    const auth = await authenticate(request);
    if (!auth.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { threadId } = await params;

    // Verify thread exists and belongs to user
    const [thread] = await db
      .select()
      .from(threads)
      .where(and(
        eq(threads.id, threadId),
        eq(threads.workspaceId, auth.user.workspaceId)
      ))
      .limit(1);

    if (!thread) {
      return NextResponse.json({ error: "Hilo no encontrado" }, { status: 404 });
    }

    // Get agent
    let agent = null;
    if (thread.agentId) {
      [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, thread.agentId))
        .limit(1);
    }

    if (!agent) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    }

    // Decrypt model key
    let modelKey = "";
    if (agent.modelKeyCiphertext) {
      try {
        modelKey = decrypt(agent.modelKeyCiphertext, process.env.ENCRYPTION_KEY!);
      } catch (e) {
        console.error("Error decrypting model key:", e);
      }
    }

    // Create transform stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const processor = new AgentTurnProcessor(
            auth.user.workspaceId,
            threadId,
            agent.id,
            "", // User message will be passed via POST
            agent.modelName || "grok",
            modelKey,
            agent.autonomy || 2
          );

          for await (const sseMessage of processor.process()) {
            const data = `data: ${JSON.stringify(sseMessage)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          controller.close();
        } catch (error) {
          const errorMessage: SSEMessage = {
            type: "error",
            data: { error: error instanceof Error ? error.message : "Error desconocido" },
            timestamp: Date.now(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("SSE Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}

// POST handler for sending messages
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    // Authenticate
    const auth = await authenticate(request);
    if (!auth.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { threadId } = await params;
    const body = await request.json();
    const { content, files } = body;

    // Validate
    const validation = messageSchema.safeParse({ content });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Verify thread exists
    const [thread] = await db
      .select()
      .from(threads)
      .where(and(
        eq(threads.id, threadId),
        eq(threads.workspaceId, auth.user.workspaceId)
      ))
      .limit(1);

    if (!thread) {
      return NextResponse.json({ error: "Hilo no encontrado" }, { status: 404 });
    }

    // Save user message
    const userMessageId = uuidv4();
    await db.insert(messages).values({
      id: userMessageId,
      threadId,
      authorType: "user",
      authorId: auth.user.id,
      content,
      isStreaming: false,
      streamCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Get agent
    let agent = null;
    if (thread.agentId) {
      [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, thread.agentId))
        .limit(1);
    }

    if (!agent) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    }

    // Update thread last message time
    await db
      .update(threads)
      .set({ lastMessageAt: new Date() })
      .where(eq(threads.id, threadId));

    // Start agent turn (in production, this would be queued via BullMQ)
    // For now, just return success
    return NextResponse.json({
      success: true,
      messageId: userMessageId,
      message: "Mensaje enviado. El agente responderá pronto.",
    });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
