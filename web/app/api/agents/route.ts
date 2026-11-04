import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAgent, getAgentsByWorkspace, getAgentById, updateAgent, deleteAgent, toggleAgentStatus } from "../../../lib/agents";
import { authenticate } from "../../../lib/api/auth";

// Validation schemas
const CreateAgentSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  emoji: z.string().optional(),
  color: z.string().optional(),
  role: z.string().min(1, "El rol es obligatorio"),
  personality: z.string().optional(),
  instructions: z.string().optional(),
  autonomy: z.number().min(1).max(3).optional(),
  modelBaseUrl: z.string().optional(),
  modelName: z.string().optional(),
  modelKey: z.string().optional(),
});

const UpdateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  emoji: z.string().optional(),
  color: z.string().optional(),
  role: z.string().optional(),
  personality: z.string().optional(),
  instructions: z.string().optional(),
  autonomy: z.number().min(1).max(3).optional(),
  modelBaseUrl: z.string().optional(),
  modelName: z.string().optional(),
  modelKey: z.string().optional(),
  status: z.enum(["active", "paused", "error"]).optional(),
});

// GET /api/agents - List all agents for workspace
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const agents = await getAgentsByWorkspace(auth.workspaceId);
    
    return NextResponse.json({
      success: true,
      data: agents,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener agentes" },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateAgentSchema.parse(body);

    const agent = await createAgent(auth.workspaceId, validated);
    
    return NextResponse.json({
      success: true,
      data: agent,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error al crear agente" },
      { status: 500 }
    );
  }
}
