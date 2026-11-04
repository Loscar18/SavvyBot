import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSkillsByAgent, createSkill, updateSkill, deleteSkill } from "../../../lib/agents";
import { authenticate } from "../../../lib/api/auth";

const CreateSkillSchema = z.object({
  agentId: z.string().min(1),
  name: z.string().min(1),
  goal: z.string().min(1),
  steps: z.array(z.string()).optional(),
  inputs: z.record(z.string()).optional(),
  outputs: z.record(z.string()).optional(),
  knownErrors: z.array(z.string()).optional(),
});

const UpdateSkillSchema = z.object({
  name: z.string().min(1).optional(),
  goal: z.string().min(1).optional(),
  steps: z.array(z.string()).optional(),
  inputs: z.record(z.string()).optional(),
  outputs: z.record(z.string()).optional(),
  knownErrors: z.array(z.string()).optional(),
});

// GET /api/skills - List skills for workspace
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { agentId } = await request.nextUrl.searchParams;

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId es obligatorio" },
        { status: 400 }
      );
    }

    const skills = await getSkillsByAgent(agentId, auth.workspaceId);

    return NextResponse.json({
      success: true,
      data: skills,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener habilidades" },
      { status: 500 }
    );
  }
}

// POST /api/skills - Create a new skill
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateSkillSchema.parse(body);

    const skill = await createSkill(
      validated.agentId,
      auth.workspaceId,
      validated
    );

    return NextResponse.json({
      success: true,
      data: skill,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error al crear habilidad" },
      { status: 500 }
    );
  }
}
