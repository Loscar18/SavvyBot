import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import { approvals, threads, messages } from "../../../lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authenticate } from "../../../lib/api/auth";

// GET /api/approvals - List pending approvals for workspace
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { status = "pending" } = await request.nextUrl.searchParams;

    const query = db
      .select({
        id: approvals.id,
        threadId: approvals.threadId,
        workspaceId: approvals.workspaceId,
        agentId: approvals.agentId,
        toolName: approvals.toolName,
        integrationId: approvals.integrationId,
        payload: approvals.payload,
        status: approvals.status,
        decidedAt: approvals.decidedAt,
        decidedBy: approvals.decidedBy,
        createdAt: approvals.createdAt,
      })
      .from(approvals)
      .where(eq(approvals.workspaceId, auth.workspaceId))
      .orderBy(desc(approvals.createdAt));

    if (status !== "all") {
      query.where(and(
        eq(approvals.workspaceId, auth.workspaceId),
        eq(approvals.status, status as any)
      ));
    }

    const approvalsList = await query;

    // Enrich with thread and agent info
    const enriched = await Promise.all(
      approvalsList.map(async (approval) => {
        // Get thread info
        const [thread] = await db
          .select({
            id: threads.id,
            title: threads.title,
            agentId: threads.agentId,
            groupId: threads.groupId,
          })
          .from(threads)
          .where(eq(threads.id, approval.threadId))
          .limit(1);

        return {
          ...approval,
          thread: thread || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener aprobaciones" },
      { status: 500 }
    );
  }
}
