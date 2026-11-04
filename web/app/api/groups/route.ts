import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import { groups, groupMembers, agents, workspaces, threads, messages } from "../../../lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authenticate } from "../../../lib/api/auth";

const CreateGroupSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  emoji: z.string().optional(),
  mode: z.enum(["todos", "relevo"]).default("todos"),
  coordinatorId: z.string().optional(),
  agentIds: z.array(z.string()).optional(),
});

const UpdateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  emoji: z.string().optional(),
  mode: z.enum(["todos", "relevo"]).optional(),
  coordinatorId: z.string().optional(),
});

// GET /api/groups - List all groups for workspace
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const groupsList = await db
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
      .where(eq(groups.workspaceId, auth.workspaceId))
      .orderBy(desc(groups.createdAt));

    // Get members for each group
    const groupsWithMembers = await Promise.all(
      groupsList.map(async (group) => {
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
            },
          })
          .from(groupMembers)
          .leftJoin(agents, eq(groupMembers.agentId, agents.id))
          .where(eq(groupMembers.groupId, group.id));

        return {
          ...group,
          members: members.map((m) => ({
            ...m,
            agent: m.agent,
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: groupsWithMembers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener grupos" },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateGroupSchema.parse(body);

    // Create group
    const [group] = await db
      .insert(groups)
      .values({
        workspaceId: auth.workspaceId,
        name: validated.name,
        emoji: validated.emoji || "👥",
        mode: validated.mode,
        coordinatorId: validated.coordinatorId || null,
      })
      .returning();

    // Add members if provided
    if (validated.agentIds && validated.agentIds.length > 0) {
      await db.insert(groupMembers).values(
        validated.agentIds.map((agentId) => ({
          groupId: group.id,
          agentId,
          muted: false,
        }))
      );
    }

    // Get group with members
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
        },
      })
      .from(groupMembers)
      .leftJoin(agents, eq(groupMembers.agentId, agents.id))
      .where(eq(groupMembers.groupId, group.id));

    return NextResponse.json({
      success: true,
      data: {
        ...group,
        members: members.map((m) => ({
          ...m,
          agent: m.agent,
        })),
      },
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error al crear grupo" },
      { status: 500 }
    );
  }
}
