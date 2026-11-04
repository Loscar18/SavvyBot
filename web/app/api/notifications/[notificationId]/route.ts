import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { notifications } from "../../../../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../../../../lib/api/auth";

// PUT /api/notifications/[notificationId] - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [notification] = await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, auth.userId),
        eq(notifications.workspaceId, auth.workspaceId)
      ))
      .returning();

    if (!notification) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al marcar notificación" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[notificationId] - Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [result] = await db
      .delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, auth.userId),
        eq(notifications.workspaceId, auth.workspaceId)
      ))
      .returning({ id: notifications.id });

    if (!result) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Notificación eliminada correctamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar notificación" },
      { status: 500 }
    );
  }
}
