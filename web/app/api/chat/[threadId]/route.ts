import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { messages, threads, agents, groups } from "../../../../lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authenticate } from "../../../../lib/auth";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// Zod schema for message input
const messageSchema = z.object({
  content: z.string().min(1, "El mensaje no puede estar vacío"),
  files: z.array(z.any()).optional(),
});

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

    // Get messages
    const threadMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(desc(messages.createdAt));

    // Get agent info
    let agent = null;
    if (thread.agentId) {
      [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, thread.agentId))
        .limit(1);
    }

    // Get group info
    let group = null;
    if (thread.groupId) {
      [group] = await db
        .select()
        .from(groups)
        .where(eq(groups.id, thread.groupId))
        .limit(1);
    }

    return NextResponse.json({
      success: true,
      thread,
      messages: threadMessages.reverse(),
      agent,
      group,
    });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}

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
    const { content, files = [] } = body;

    // Validate
    const validation = messageSchema.safeParse({ content, files });
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

    // Update thread last message time
    await db
      .update(threads)
      .set({ lastMessageAt: new Date() })
      .where(eq(threads.id, threadId));

    // Get agent
    let agent = null;
    if (thread.agentId) {
      [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, thread.agentId))
        .limit(1);
    }

    // Create job for agent turn (in production, this would use BullMQ)
    // For now, simulate agent response
    if (agent) {
      // Simulate agent thinking
      setTimeout(async () => {
        const agentMessageId = uuidv4();
        await db.insert(messages).values({
          id: agentMessageId,
          threadId,
          authorType: "agent",
          agentId: agent.id,
          content: `He recibido tu mensaje: "${content.slice(0, 100)}${content.length > 100 ? '...' : ''}". Estoy procesándolo y responderé en breve.`,
          modelUsed: agent.modelName || "grok",
          isStreaming: false,
          streamCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Update thread last message time
        await db
          .update(threads)
          .set({ lastMessageAt: new Date() })
          .where(eq(threads.id, threadId));
      }, 1000);
    }

    return NextResponse.json({
      success: true,
      messageId: userMessageId,
      message: "Mensaje enviado",
    });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete thread
    await db.delete(threads).where(eq(threads.id, threadId));

    return NextResponse.json({
      success: true,
      message: "Hilo eliminado",
    });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
