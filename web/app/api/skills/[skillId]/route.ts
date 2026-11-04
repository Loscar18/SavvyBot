import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateSkill, deleteSkill } from "../../../../lib/agents";
import { authenticate } from "../../../../lib/api/auth";
import { db } from "../../../../lib/db";
import { skills, agents } from "../../../../lib/db/schema";
import { eq, and } from "drizzle-orm";

const UpdateSkillSchema = z.object({
  name: z.string().min(1).optional(),
  goal: z.string().min(1).optional(),
  steps: z.array(z.string()).optional(),
  inputs: z.record(z.string()).optional(),
  outputs: z.record(z.string()).optional(),
  knownErrors: z.array(z.string()).optional(),
});

// GET /api/skills/[skillId] - Get skill details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const { skillId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [skill] = await db
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
      .leftJoin(agents, eq(skills.agentId, agents.id))
      .where(and(
        eq(skills.id, skillId),
        eq(agents.workspaceId, auth.workspaceId)
      ))
      .limit(1);

    if (!skill) {
      return NextResponse.json({ error: "Habilidad no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: skill,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener habilidad" },
      { status: 500 }
    );
  }
}

// PUT /api/skills/[skillId] - Update skill
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const { skillId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateSkillSchema.parse(body);

    // Get skill to find agentId and workspace
    const [skill] = await db
      .select({
        id: skills.id,
        agentId: skills.agentId,
      })
      .from(skills)
      .leftJoin(agents, eq(skills.agentId, agents.id))
      .where(and(
        eq(skills.id, skillId),
        eq(agents.workspaceId, auth.workspaceId)
      ))
      .limit(1);

    if (!skill) {
      return NextResponse.json({ error: "Habilidad no encontrada" }, { status: 404 });
    }

    const updated = await updateSkill(
      skillId,
      skill.agentId,
      auth.workspaceId,
      validated
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error al actualizar habilidad" },
      { status: 500 }
    );
  }
}

// DELETE /api/skills/[skillId] - Delete skill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ skillId: string }> }
) {
  try {
    const { skillId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get skill to find agentId
    const [skill] = await db
      .select({
        id: skills.id,
        agentId: skills.agentId,
      })
      .from(skills)
      .leftJoin(agents, eq(skills.agentId, agents.id))
      .where(and(
        eq(skills.id, skillId),
        eq(agents.workspaceId, auth.workspaceId)
      ))
      .limit(1);

    if (!skill) {
      return NextResponse.json({ error: "Habilidad no encontrada" }, { status: 404 });
    }

    const deleted = await deleteSkill(skillId, skill.agentId, auth.workspaceId);

    if (!deleted) {
      return NextResponse.json({ error: "Error al eliminar habilidad" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Habilidad eliminada correctamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar habilidad" },
      { status: 500 }
    );
  }
}
