import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { notifications } from "../../../lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authenticate } from "../../../lib/api/auth";

// GET /api/notifications - List notifications for user
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { read = "false", limit = "50" } = await request.nextUrl.searchParams;

    const query = db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        workspaceId: notifications.workspaceId,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        data: notifications.data,
        read: notifications.read,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(and(
        eq(notifications.userId, auth.userId),
        eq(notifications.workspaceId, auth.workspaceId)
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(parseInt(limit));

    if (read === "false") {
      query.where(and(
        eq(notifications.userId, auth.userId),
        eq(notifications.workspaceId, auth.workspaceId),
        eq(notifications.read, false)
      ));
    }

    const notificationsList = await query;

    // Count unread
    const [unreadCount] = await db
      .select({ count: notifications.id.count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, auth.userId),
        eq(notifications.workspaceId, auth.workspaceId),
        eq(notifications.read, false)
      ));

    return NextResponse.json({
      success: true,
      data: notificationsList,
      unreadCount: unreadCount?.count || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.userId, auth.userId),
        eq(notifications.workspaceId, auth.workspaceId),
        eq(notifications.read, false)
      ));

    return NextResponse.json({
      success: true,
      message: "Todas las notificaciones marcadas como leídas",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al marcar notificaciones" },
      { status: 500 }
    );
  }
}
