import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../lib/db";
import { routines, routineLogs } from "../../../../lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authenticate } from "../../../../lib/api/auth";

const UpdateRoutineSchema = z.object({
  targetType: z.enum(["agent", "group", "workspace"]).optional(),
  targetId: z.string().optional(),
  triggerType: z.enum(["daily", "weekly", "hourly", "manual"]).optional(),
  triggerValue: z.string().optional(),
  action: z.string().optional(),
  autonomy: z.number().min(1).max(3).optional(),
  enabled: z.boolean().optional(),
  description: z.string().optional(),
});

// GET /api/routines/[routineId] - Get routine details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string }> }
) {
  try {
    const { routineId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [routine] = await db
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
      .where(and(
        eq(routines.id, routineId),
        eq(routines.workspaceId, auth.workspaceId)
      ))
      .limit(1);

    if (!routine) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }

    // Get all logs
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
      .where(eq(routineLogs.routineId, routineId))
      .orderBy(desc(routineLogs.startedAt));

    return NextResponse.json({
      success: true,
      data: {
        routine,
        logs,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener rutina" },
      { status: 500 }
    );
  }
}

// PUT /api/routines/[routineId] - Update routine
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string }> }
) {
  try {
    const { routineId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateRoutineSchema.parse(body);

    const [routine] = await db
      .update(routines)
      .set({
        targetType: validated.targetType,
        targetId: validated.targetId,
        triggerType: validated.triggerType,
        triggerValue: validated.triggerValue,
        action: validated.action,
        autonomy: validated.autonomy,
        enabled: validated.enabled,
        description: validated.description,
        updatedAt: new Date(),
      })
      .where(and(
        eq(routines.id, routineId),
        eq(routines.workspaceId, auth.workspaceId)
      ))
      .returning();

    if (!routine) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: routine,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error al actualizar rutina" },
      { status: 500 }
    );
  }
}

// DELETE /api/routines/[routineId] - Delete routine
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string }> }
) {
  try {
    const { routineId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Delete logs first
    await db
      .delete(routineLogs)
      .where(eq(routineLogs.routineId, routineId));

    // Delete routine
    const [result] = await db
      .delete(routines)
      .where(and(
        eq(routines.id, routineId),
        eq(routines.workspaceId, auth.workspaceId)
      ))
      .returning({ id: routines.id });

    if (!result) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Rutina eliminada correctamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar rutina" },
      { status: 500 }
    );
  }
}

// POST /api/routines/[routineId]/execute - Execute routine manually
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string }> }
) {
  try {
    const { routineId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [routine] = await db
      .select({
        id: routines.id,
        workspaceId: routines.workspaceId,
        targetType: routines.targetType,
        targetId: routines.targetId,
        action: routines.action,
        autonomy: routines.autonomy,
        enabled: routines.enabled,
      })
      .from(routines)
      .where(and(
        eq(routines.id, routineId),
        eq(routines.workspaceId, auth.workspaceId)
      ))
      .limit(1);

    if (!routine) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }

    if (!routine.enabled) {
      return NextResponse.json(
        { error: "La rutina está deshabilitada" },
        { status: 400 }
      );
    }

    // TODO: Queue routine execution
    // For now, just log it
    await db.insert(routineLogs).values({
      routineId,
      status: "queued",
      summary: "Ejecución manual solicitada",
      startedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Rutina encolada para ejecución",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al ejecutar rutina" },
      { status: 500 }
    );
  }
}

// POST /api/routines/[routineId]/toggle - Toggle routine enabled/disabled
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ routineId: string }> }
) {
  try {
    const { routineId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [routine] = await db
      .select({
        id: routines.id,
        enabled: routines.enabled,
      })
      .from(routines)
      .where(and(
        eq(routines.id, routineId),
        eq(routines.workspaceId, auth.workspaceId)
      ))
      .limit(1);

    if (!routine) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }

    const [updated] = await db
      .update(routines)
      .set({
        enabled: !routine.enabled,
        updatedAt: new Date(),
      })
      .where(eq(routines.id, routineId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al cambiar estado de rutina" },
      { status: 500 }
    );
  }
}
