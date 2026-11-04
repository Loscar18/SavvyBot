import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { workspaces, users } from "../../../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../../../lib/api/auth";

// GET /api/workspaces - Get current workspace info
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [workspace] = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        plan: workspaces.plan,
        timezone: workspaces.timezone,
        language: workspaces.language,
        theme: workspaces.theme,
        billingEnabled: workspaces.billingEnabled,
        stripeCustomerId: workspaces.stripeCustomerId,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      })
      .from(workspaces)
      .where(eq(workspaces.id, auth.workspaceId))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace no encontrado" }, { status: 404 });
    }

    // Get workspace members
    const members = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        emailVerified: users.emailVerified,
        image: users.image,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.workspaceId, auth.workspaceId))
      .orderBy(users.createdAt);

    return NextResponse.json({
      success: true,
      data: {
        workspace,
        members,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener workspace" },
      { status: 500 }
    );
  }
}
