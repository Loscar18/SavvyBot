import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../lib/db";
import { groups, groupMembers, agents } from "../../../../lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authenticate } from "../../../../lib/api/auth";

const UpdateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  emoji: z.string().optional(),
  mode: z.enum(["todos", "relevo"]).optional(),
  coordinatorId: z.string().optional(),
});

// GET /api/groups/[groupId] - Get group details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [group] = await db
      .select({
        id: groups.id,
        workspaceId: groups.workspaceId,
        name: groups.name,
        emoji: groups.emoji,
        mode: groups.mode,
        coordinatorId: groups.coordinatorId,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
      })
      .from(groups)
      .where(and(
        eq(groups.id, groupId),
        eq(groups.workspaceId, auth.workspaceId)
      ))
      .limit(1);

    if (!group) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }

    // Get members
    const members = await db
      .select({
        id: groupMembers.id,
        groupId: groupMembers.groupId,
        agentId: groupMembers.agentId,
        muted: groupMembers.muted,
        agent: {
          id: agents.id,
          name: agents.name,
          emoji: agents.emoji,
          color: agents.color,
          role: agents.role,
          status: agents.status,
          autonomy: agents.autonomy,
        },
      })
      .from(groupMembers)
      .leftJoin(agents, eq(groupMembers.agentId, agents.id))
      .where(eq(groupMembers.groupId, groupId));

    // Get available agents to add
    const availableAgents = await db
      .select({
        id: agents.id,
        name: agents.name,
        emoji: agents.emoji,
        color: agents.color,
        role: agents.role,
      })
      .from(agents)
      .where(and(
        eq(agents.workspaceId, auth.workspaceId),
        // Not already in group
        // This would need a NOT IN subquery in a real implementation
      ));

    return NextResponse.json({
      success: true,
      data: {
        ...group,
        members: members.map((m) => ({
          ...m,
          agent: m.agent,
        })),
        availableAgents,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener grupo" },
      { status: 500 }
    );
  }
}

// PUT /api/groups/[groupId] - Update group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateGroupSchema.parse(body);

    const [group] = await db
      .update(groups)
      .set({
        name: validated.name,
        emoji: validated.emoji,
        mode: validated.mode,
        coordinatorId: validated.coordinatorId,
        updatedAt: new Date(),
      })
      .where(and(
        eq(groups.id, groupId),
        eq(groups.workspaceId, auth.workspaceId)
      ))
      .returning();

    if (!group) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: group,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error al actualizar grupo" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[groupId] - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Delete group members first
    await db
      .delete(groupMembers)
      .where(eq(groupMembers.groupId, groupId));

    // Delete group
    const [result] = await db
      .delete(groups)
      .where(and(
        eq(groups.id, groupId),
        eq(groups.workspaceId, auth.workspaceId)
      ))
      .returning({ id: groups.id });

    if (!result) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Grupo eliminado correctamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar grupo" },
      { status: 500 }
    );
  }
}

// POST /api/groups/[groupId]/members - Add member to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId es obligatorio" },
        { status: 400 }
      );
    }

    // Check if group exists
    const [group] = await db
      .select({ id: groups.id })
      .from(groups)
      .where(and(
        eq(groups.id, groupId),
        eq(groups.workspaceId, auth.workspaceId)
      ))
      .limit(1);

    if (!group) {
      return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
    }

    // Check if agent exists and belongs to workspace
    const [agent] = await db
      .select({ id: agents.id })
      .from(agents)
      .where(and(
        eq(agents.id, agentId),
        eq(agents.workspaceId, auth.workspaceId)
      ))
      .limit(1);

    if (!agent) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
    }

    // Check if already in group
    const [existing] = await db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.agentId, agentId)
      ))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "El agente ya es miembro del grupo" },
        { status: 400 }
      );
    }

    const [member] = await db
      .insert(groupMembers)
      .values({
        groupId,
        agentId,
        muted: false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: member,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al agregar miembro" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[groupId]/members/[memberId] - Remove member from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  try {
    const { groupId, memberId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [result] = await db
      .delete(groupMembers)
      .where(and(
        eq(groupMembers.id, memberId),
        eq(groupMembers.groupId, groupId)
      ))
      .returning({ id: groupMembers.id });

    if (!result) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Miembro eliminado correctamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar miembro" },
      { status: 500 }
    );
  }
}

// POST /api/groups/[groupId]/mute - Mute/unmute member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, muted } = body;

    if (!agentId || muted === undefined) {
      return NextResponse.json(
        { error: "agentId y muted son obligatorios" },
        { status: 400 }
      );
    }

    const [member] = await db
      .update(groupMembers)
      .set({ muted })
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.agentId, agentId)
      ))
      .returning();

    if (!member) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al cambiar estado de silencio" },
      { status: 500 }
    );
  }
}
