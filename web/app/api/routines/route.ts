import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import { routines, routineLogs, workspaces, agents, groups } from "../../../lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authenticate } from "../../../lib/api/auth";

const CreateRoutineSchema = z.object({
  targetType: z.enum(["agent", "group", "workspace"]),
  targetId: z.string().min(1),
  triggerType: z.enum(["daily", "weekly", "hourly", "manual"]),
  triggerValue: z.string(),
  action: z.string().min(1),
  autonomy: z.number().min(1).max(3).default(2),
  enabled: z.boolean().default(true),
  description: z.string().optional(),
});

// GET /api/routines - List all routines for workspace
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const routinesList = await db
      .select({
        id: routines.id,
        workspaceId: routines.workspaceId,
        targetType: routines.targetType,
        targetId: routines.targetId,
        triggerType: routines.triggerType,
        triggerValue: routines.triggerValue,
        action: routines.action,
        autonomy: routines.autonomy,
        enabled: routines.enabled,
        lastRunAt: routines.lastRunAt,
        consecutiveFailures: routines.consecutiveFailures,
        description: routines.description,
        createdAt: routines.createdAt,
        updatedAt: routines.updatedAt,
      })
      .from(routines)
      .where(eq(routines.workspaceId, auth.workspaceId))
      .orderBy(desc(routines.createdAt));

    // Enrich with target details
    const enrichedRoutines = await Promise.all(
      routinesList.map(async (routine) => {
        let targetName = "Desconocido";
        let targetEmoji = "❓";

        if (routine.targetType === "agent") {
          const [agent] = await db
            .select({ name: agents.name, emoji: agents.emoji })
            .from(agents)
            .where(and(
              eq(agents.id, routine.targetId),
              eq(agents.workspaceId, auth.workspaceId)
            ))
            .limit(1);
          targetName = agent?.name || "Agente eliminado";
          targetEmoji = agent?.emoji || "🤖";
        } else if (routine.targetType === "group") {
          const [group] = await db
            .select({ name: groups.name, emoji: groups.emoji })
            .from(groups)
            .where(and(
              eq(groups.id, routine.targetId),
              eq(groups.workspaceId, auth.workspaceId)
            ))
            .limit(1);
          targetName = group?.name || "Grupo eliminado";
          targetEmoji = group?.emoji || "👥";
        } else {
          targetName = "Workspace";
          targetEmoji = "🏢";
        }

        // Get last 5 logs
        const logs = await db
          .select({
            id: routineLogs.id,
            routineId: routineLogs.routineId,
            status: routineLogs.status,
            summary: routineLogs.summary,
            startedAt: routineLogs.startedAt,
            finishedAt: routineLogs.finishedAt,
          })
          .from(routineLogs)
          .where(eq(routineLogs.routineId, routine.id))
          .orderBy(desc(routineLogs.startedAt))
          .limit(5);

        return {
          ...routine,
          targetName,
          targetEmoji,
          logs,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedRoutines,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener rutinas" },
      { status: 500 }
    );
  }
}

// POST /api/routines - Create a new routine
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateRoutineSchema.parse(body);

    // Validate target exists
    if (validated.targetType === "agent") {
      const [agent] = await db
        .select({ id: agents.id })
        .from(agents)
        .where(and(
          eq(agents.id, validated.targetId),
          eq(agents.workspaceId, auth.workspaceId)
        ))
        .limit(1);
      
      if (!agent) {
        return NextResponse.json(
          { error: "Agente no encontrado" },
          { status: 404 }
        );
      }
    } else if (validated.targetType === "group") {
      const [group] = await db
        .select({ id: groups.id })
        .from(groups)
        .where(and(
          eq(groups.id, validated.targetId),
          eq(groups.workspaceId, auth.workspaceId)
        ))
        .limit(1);
      
      if (!group) {
        return NextResponse.json(
          { error: "Grupo no encontrado" },
          { status: 404 }
        );
      }
    }

    const [routine] = await db
      .insert(routines)
      .values({
        workspaceId: auth.workspaceId,
        targetType: validated.targetType,
        targetId: validated.targetId,
        triggerType: validated.triggerType,
        triggerValue: validated.triggerValue,
        action: validated.action,
        autonomy: validated.autonomy,
        enabled: validated.enabled,
        description: validated.description,
        consecutiveFailures: 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: routine,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error al crear rutina" },
      { status: 500 }
    );
  }
}
