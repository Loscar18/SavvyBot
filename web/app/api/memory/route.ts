import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMemories, addAgentMemory, updateMemory, deleteMemory } from "../../../lib/agents";
import { authenticate } from "../../../lib/api/auth";

const CreateMemorySchema = z.object({
  text: z.string().min(1),
  type: z.enum(["note", "fact", "instruction"]).optional(),
  scope: z.enum(["global", "agent"]).optional(),
  agentId: z.string().optional(),
});

// GET /api/memory - List memories for workspace
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { agentId, scope } = await request.nextUrl.searchParams;

    const memories = await getMemories(auth.workspaceId, agentId || undefined);

    // Filter by scope if provided
    const filteredMemories = scope 
      ? memories.filter((m) => m.scope === scope)
      : memories;

    return NextResponse.json({
      success: true,
      data: filteredMemories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener memorias" },
      { status: 500 }
    );
  }
}

// POST /api/memory - Create a new memory
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateMemorySchema.parse(body);

    const memory = await addAgentMemory(
      auth.workspaceId,
      validated.agentId || "",
      validated.text,
      validated.type,
      validated.scope
    );

    return NextResponse.json({
      success: true,
      data: memory,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error al crear memoria" },
      { status: 500 }
    );
  }
}
