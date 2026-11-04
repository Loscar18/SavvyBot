import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAgentById, updateAgent, deleteAgent, toggleAgentStatus, getAgentActivity, getAvailableTools, getToolPermissions, setToolPermission, getMemories, addAgentMemory, getSkillsByAgent, createSkill, updateSkill, deleteSkill } from "../../../../lib/agents";
import { authenticate } from "../../../../lib/api/auth";

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

// GET /api/agents/[agentId] - Get agent details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const agent = await getAgentById(agentId, auth.workspaceId);
    if (!agent) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    }

    // Get additional data
    const [activity, tools, permissions, memories, skills] = await Promise.all([
      getAgentActivity(agentId, auth.workspaceId),
      getAvailableTools(agentId, auth.workspaceId),
      getToolPermissions(agentId, auth.workspaceId),
      getMemories(auth.workspaceId, agentId),
      getSkillsByAgent(agentId, auth.workspaceId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        agent,
        activity,
        availableTools: tools,
        toolPermissions: permissions,
        memories,
        skills,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener agente" },
      { status: 500 }
    );
  }
}

// PUT /api/agents/[agentId] - Update agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateAgentSchema.parse(body);

    const agent = await updateAgent(agentId, auth.workspaceId, validated);
    if (!agent) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error al actualizar agente" },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[agentId] - Delete agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const deleted = await deleteAgent(agentId, auth.workspaceId);
    if (!deleted) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Agente eliminado correctamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar agente" },
      { status: 500 }
    );
  }
}

// POST /api/agents/[agentId]/toggle - Toggle agent status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const agent = await toggleAgentStatus(agentId, auth.workspaceId);
    if (!agent) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: agent,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al cambiar estado del agente" },
      { status: 500 }
    );
  }
}

// POST /api/agents/[agentId]/memory - Add memory to agent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { text, type = "note", scope = "agent" } = body;

    if (!text) {
      return NextResponse.json(
        { error: "El texto de la memoria es obligatorio" },
        { status: 400 }
      );
    }

    const memory = await addAgentMemory(auth.workspaceId, agentId, text, type as any, scope as any);

    return NextResponse.json({
      success: true,
      data: memory,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al agregar memoria" },
      { status: 500 }
    );
  }
}

// POST /api/agents/[agentId]/skills - Create skill
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, goal, steps, inputs, outputs, knownErrors } = body;

    if (!name || !goal) {
      return NextResponse.json(
        { error: "Nombre y objetivo son obligatorios" },
        { status: 400 }
      );
    }

    const skill = await createSkill(agentId, auth.workspaceId, {
      name,
      goal,
      steps,
      inputs,
      outputs,
      knownErrors,
    });

    return NextResponse.json({
      success: true,
      data: skill,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al crear habilidad" },
      { status: 500 }
    );
  }
}

// PUT /api/agents/[agentId]/permissions - Set tool permission
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { integrationId, toolName, scope } = body;

    if (!integrationId || !toolName || !scope) {
      return NextResponse.json(
        { error: "integrationId, toolName y scope son obligatorios" },
        { status: 400 }
      );
    }

    const permission = await setToolPermission(
      agentId,
      integrationId,
      toolName,
      scope as any,
      auth.workspaceId
    );

    return NextResponse.json({
      success: true,
      data: permission,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al configurar permiso" },
      { status: 500 }
    );
  }
}
