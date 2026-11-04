import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../lib/db";
import { approvals, jobs } from "../../../../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../../../../lib/api/auth";
import { queueAgentTurn } from "../../../../lib/queue";

// POST /api/approvals/[approvalId]/approve - Approve an approval
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ approvalId: string }> }
) {
  try {
    const { approvalId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get approval
    const [approval] = await db
      .select({
        id: approvals.id,
        threadId: approvals.threadId,
        workspaceId: approvals.workspaceId,
        agentId: approvals.agentId,
        toolName: approvals.toolName,
        integrationId: approvals.integrationId,
        payload: approvals.payload,
        jobId: approvals.jobId,
        status: approvals.status,
      })
      .from(approvals)
      .where(and(
        eq(approvals.id, approvalId),
        eq(approvals.workspaceId, auth.workspaceId)
      ))
      .limit(1);

    if (!approval) {
      return NextResponse.json({ error: "Aprobación no encontrada" }, { status: 404 });
    }

    if (approval.status !== "pending") {
      return NextResponse.json(
        { error: "Esta aprobación ya ha sido procesada" },
        { status: 400 }
      );
    }

    // Update approval status
    await db
      .update(approvals)
      .set({
        status: "approved",
        decidedAt: new Date(),
        decidedBy: auth.userId,
      })
      .where(eq(approvals.id, approvalId));

    // Resume the job if it was waiting for approval
    if (approval.jobId) {
      await db
        .update(jobs)
        .set({
          status: "resumed",
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, approval.jobId));

      // Queue the agent turn to continue
      await queueAgentTurn(
        approval.workspaceId,
        approval.agentId,
        approval.threadId,
        approval.jobId
      );
    }

    // Create approval message in thread
    await db.insert(messages).values({
      threadId: approval.threadId,
      authorType: "system",
      content: `✅ Aprobación concedida para ${approval.toolName} por ${auth.name || auth.userId}`,
      metadata: {
        type: "approval",
        approvalId,
        status: "approved",
        toolName: approval.toolName,
        payload: approval.payload,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Aprobación concedida",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al aprobar" },
      { status: 500 }
    );
  }
}

// POST /api/approvals/[approvalId]/reject - Reject an approval
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ approvalId: string }> }
) {
  try {
    const { approvalId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { reason } = body;

    // Get approval
    const [approval] = await db
      .select({
        id: approvals.id,
        threadId: approvals.threadId,
        workspaceId: approvals.workspaceId,
        agentId: approvals.agentId,
        toolName: approvals.toolName,
        integrationId: approvals.integrationId,
        payload: approvals.payload,
        jobId: approvals.jobId,
        status: approvals.status,
      })
      .from(approvals)
      .where(and(
        eq(approvals.id, approvalId),
        eq(approvals.workspaceId, auth.workspaceId)
      ))
      .limit(1);

    if (!approval) {
      return NextResponse.json({ error: "Aprobación no encontrada" }, { status: 404 });
    }

    if (approval.status !== "pending") {
      return NextResponse.json(
        { error: "Esta aprobación ya ha sido procesada" },
        { status: 400 }
      );
    }

    // Update approval status
    await db
      .update(approvals)
      .set({
        status: "rejected",
        decidedAt: new Date(),
        decidedBy: auth.userId,
        rejectionReason: reason || "Rechazado por el usuario",
      })
      .where(eq(approvals.id, approvalId));

    // Cancel the job if it was waiting for approval
    if (approval.jobId) {
      await db
        .update(jobs)
        .set({
          status: "cancelled",
          error: `Aprobación rechazada: ${reason || "Rechazado por el usuario"}`,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, approval.jobId));
    }

    // Create rejection message in thread
    await db.insert(messages).values({
      threadId: approval.threadId,
      authorType: "system",
      content: `❌ Aprobación rechazada para ${approval.toolName} por ${auth.name || auth.userId}${reason ? `: ${reason}` : ""}`,
      metadata: {
        type: "approval",
        approvalId,
        status: "rejected",
        toolName: approval.toolName,
        payload: approval.payload,
        reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Aprobación rechazada",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al rechazar" },
      { status: 500 }
    );
  }
}
