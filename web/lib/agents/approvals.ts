import { db } from "../db";
import { approvals, threads, messages, jobs, agents, workspaces, users } from "../db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { queueAgentTurn } from "../queue";

// Approval types
export interface Approval {
  id: string;
  threadId: string;
  workspaceId: string;
  agentId: string | null;
  toolName: string;
  integrationId: string | null;
  payload: any;
  status: "pending" | "approved" | "rejected" | "expired";
  decidedBy: string | null;
  decidedAt: Date | null;
  decisionReason: string | null;
  jobId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// APPROVAL CRUD
// ============================================

/**
 * Create a new approval request
 */
export async function createApproval(data: {
  workspaceId: string;
  threadId: string;
  agentId: string;
  toolName: string;
  integrationId?: string;
  payload: any;
  jobId?: string;
}): Promise<Approval> {
  const [approval] = await db
    .insert(approvals)
    .values({
      threadId: data.threadId,
      workspaceId: data.workspaceId,
      agentId: data.agentId,
      toolName: data.toolName,
      integrationId: data.integrationId || null,
      payload: data.payload,
      status: "pending",
      jobId: data.jobId || null,
    })
    .returning({
      id: approvals.id,
      threadId: approvals.threadId,
      workspaceId: approvals.workspaceId,
      agentId: approvals.agentId,
      toolName: approvals.toolName,
      integrationId: approvals.integrationId,
      payload: approvals.payload,
      status: approvals.status,
      decidedBy: approvals.decidedBy,
      decidedAt: approvals.decidedAt,
      decisionReason: approvals.decisionReason,
      jobId: approvals.jobId,
      createdAt: approvals.createdAt,
      updatedAt: approvals.updatedAt,
    });

  // Send notification (would be queued in production)
  await sendApprovalNotification(approval);

  return approval;
}

/**
 * Get approval by ID
 */
export async function getApprovalById(approvalId: string, workspaceId: string): Promise<Approval | null> {
  const [approval] = await db
    .select({
      id: approvals.id,
      threadId: approvals.threadId,
      workspaceId: approvals.workspaceId,
      agentId: approvals.agentId,
      toolName: approvals.toolName,
      integrationId: approvals.integrationId,
      payload: approvals.payload,
      status: approvals.status,
      decidedBy: approvals.decidedBy,
      decidedAt: approvals.decidedAt,
      decisionReason: approvals.decisionReason,
      jobId: approvals.jobId,
      createdAt: approvals.createdAt,
      updatedAt: approvals.updatedAt,
    })
    .from(approvals)
    .where(and(
      eq(approvals.id, approvalId),
      eq(approvals.workspaceId, workspaceId)
    ))
    .limit(1);

  return approval || null;
}

/**
 * Get pending approvals for a workspace
 */
export async function getPendingApprovals(workspaceId: string): Promise<Approval[]> {
  return await db
    .select({
      id: approvals.id,
      threadId: approvals.threadId,
      workspaceId: approvals.workspaceId,
      agentId: approvals.agentId,
      toolName: approvals.toolName,
      integrationId: approvals.integrationId,
      payload: approvals.payload,
      status: approvals.status,
      decidedBy: approvals.decidedBy,
      decidedAt: approvals.decidedAt,
      decisionReason: approvals.decisionReason,
      jobId: approvals.jobId,
      createdAt: approvals.createdAt,
      updatedAt: approvals.updatedAt,
    })
    .from(approvals)
    .where(and(
      eq(approvals.workspaceId, workspaceId),
      eq(approvals.status, "pending")
    ))
    .orderBy(desc(approvals.createdAt));
}

/**
 * Get approvals for a thread
 */
export async function getApprovalsByThread(threadId: string, workspaceId: string): Promise<Approval[]> {
  return await db
    .select({
      id: approvals.id,
      threadId: approvals.threadId,
      workspaceId: approvals.workspaceId,
      agentId: approvals.agentId,
      toolName: approvals.toolName,
      integrationId: approvals.integrationId,
      payload: approvals.payload,
      status: approvals.status,
      decidedBy: approvals.decidedBy,
      decidedAt: approvals.decidedAt,
      decisionReason: approvals.decisionReason,
      jobId: approvals.jobId,
      createdAt: approvals.createdAt,
      updatedAt: approvals.updatedAt,
    })
    .from(approvals)
    .where(and(
      eq(approvals.threadId, threadId),
      eq(approvals.workspaceId, workspaceId)
    ))
    .orderBy(desc(approvals.createdAt));
}

// ============================================
// APPROVAL ACTIONS
// ============================================

/**
 * Approve an approval request
 */
export async function approveApproval(
  approvalId: string,
  workspaceId: string,
  userId: string,
  reason?: string
): Promise<Approval | null> {
  const approval = await getApprovalById(approvalId, workspaceId);
  if (!approval || approval.status !== "pending") {
    return null;
  }

  const [updated] = await db
    .update(approvals)
    .set({
      status: "approved",
      decidedBy: userId,
      decidedAt: new Date(),
      decisionReason: reason || null,
      updatedAt: new Date(),
    })
    .where(and(
      eq(approvals.id, approvalId),
      eq(approvals.workspaceId, workspaceId)
    ))
    .returning({
      id: approvals.id,
      threadId: approvals.threadId,
      workspaceId: approvals.workspaceId,
      agentId: approvals.agentId,
      toolName: approvals.toolName,
      integrationId: approvals.integrationId,
      payload: approvals.payload,
      status: approvals.status,
      decidedBy: approvals.decidedBy,
      decidedAt: approvals.decidedAt,
      decisionReason: approvals.decisionReason,
      jobId: approvals.jobId,
      createdAt: approvals.createdAt,
      updatedAt: approvals.updatedAt,
    });

  if (!updated) {
    return null;
  }

  // Resume the job
  await resumeJobAfterApproval(updated);

  return updated;
}

/**
 * Reject an approval request
 */
export async function rejectApproval(
  approvalId: string,
  workspaceId: string,
  userId: string,
  reason?: string
): Promise<Approval | null> {
  const approval = await getApprovalById(approvalId, workspaceId);
  if (!approval || approval.status !== "pending") {
    return null;
  }

  const [updated] = await db
    .update(approvals)
    .set({
      status: "rejected",
      decidedBy: userId,
      decidedAt: new Date(),
      decisionReason: reason || null,
      updatedAt: new Date(),
    })
    .where(and(
      eq(approvals.id, approvalId),
      eq(approvals.workspaceId, workspaceId)
    ))
    .returning({
      id: approvals.id,
      threadId: approvals.threadId,
      workspaceId: approvals.workspaceId,
      agentId: approvals.agentId,
      toolName: approvals.toolName,
      integrationId: approvals.integrationId,
      payload: approvals.payload,
      status: approvals.status,
      decidedBy: approvals.decidedBy,
      decidedAt: approvals.decidedAt,
      decisionReason: approvals.decisionReason,
      jobId: approvals.jobId,
      createdAt: approvals.createdAt,
      updatedAt: approvals.updatedAt,
    });

  if (!updated) {
    return null;
  }

  // Resume the job with rejection
  await resumeJobAfterRejection(updated);

  return updated;
}

/**
 * Expire old approvals
 */
export async function expireOldApprovals(workspaceId: string, hours: number = 24): Promise<number> {
  const expiryDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  const [result] = await db
    .update(approvals)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(and(
      eq(approvals.workspaceId, workspaceId),
      eq(approvals.status, "pending"),
      lt(approvals.createdAt, expiryDate)
    ))
    .returning({ id: approvals.id });

  return result?.id ? 1 : 0;
}

// ============================================
// JOB RESUMPTION
// ============================================

/**
 * Resume job after approval
 */
async function resumeJobAfterApproval(approval: Approval): Promise<void> {
  if (!approval.jobId) {
    return;
  }

  // Get the job
  const [job] = await db
    .select({
      id: jobs.id,
      workspaceId: jobs.workspaceId,
      agentId: jobs.agentId,
      threadId: jobs.threadId,
      type: jobs.type,
      data: jobs.data,
    })
    .from(jobs)
    .where(eq(jobs.id, approval.jobId))
    .limit(1);

  if (!job) {
    return;
  }

  // Update job status
  await db
    .update(jobs)
    .set({
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, approval.jobId));

  // Record approval in message
  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, approval.decidedBy!))
    .limit(1);

  const approvalMessage = `✅ Aprobación concedida por ${user?.name || "usuario"}: ${approval.toolName}`;

  await db.insert(messages).values({
    threadId: approval.threadId,
    authorType: "system",
    content: approvalMessage,
    metadata: {
      type: "approval",
      approvalId: approval.id,
      status: "approved",
    },
  });

  // Queue the next step
  await queueAgentTurn(
    job.workspaceId,
    job.agentId!,
    job.threadId!,
    `Resumiendo después de aprobación: ${approval.toolName}`,
    { priority: 1 }
  );
}

/**
 * Resume job after rejection
 */
async function resumeJobAfterRejection(approval: Approval): Promise<void> {
  if (!approval.jobId) {
    return;
  }

  // Get the job
  const [job] = await db
    .select({
      id: jobs.id,
      workspaceId: jobs.workspaceId,
      agentId: jobs.agentId,
      threadId: jobs.threadId,
    })
    .from(jobs)
    .where(eq(jobs.id, approval.jobId))
    .limit(1);

  if (!job) {
    return;
  }

  // Update job status
  await db
    .update(jobs)
    .set({
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, approval.jobId));

  // Record rejection in message
  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, approval.decidedBy!))
    .limit(1);

  const rejectionMessage = `❌ Aprobación rechazada por ${user?.name || "usuario"}: ${approval.toolName}${approval.decisionReason ? ` - Razón: ${approval.decisionReason}` : ""}`;

  await db.insert(messages).values({
    threadId: approval.threadId,
    authorType: "system",
    content: rejectionMessage,
    metadata: {
      type: "approval",
      approvalId: approval.id,
      status: "rejected",
    },
  });

  // Queue the next step with rejection info
  await queueAgentTurn(
    job.workspaceId,
    job.agentId!,
    job.threadId!,
    `La aprobación para ${approval.toolName} fue rechazada. Por favor, propone una alternativa.`,
    { priority: 1 }
  );
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Send approval notification
 */
async function sendApprovalNotification(approval: Approval): Promise<void> {
  // In production, this would queue a notification job
  // For now, just log it
  console.log(`New approval needed: ${approval.toolName} in thread ${approval.threadId}`);
  
  // Get thread info
  const [thread] = await db
    .select({
      title: threads.title,
    })
    .from(threads)
    .where(eq(threads.id, approval.threadId))
    .limit(1);

  // Get agent info
  const [agent] = await db
    .select({
      name: agents.name,
    })
    .from(agents)
    .where(eq(agents.id, approval.agentId!))
    .limit(1);

  // Get workspace users (owners and admins)
  const usersToNotify = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(and(
      eq(users.workspaceId, approval.workspaceId),
      or(
        eq(users.role, "owner"),
        eq(users.role, "admin")
      )
    ));

  // In production, send notifications to these users
  // This could be email, push notifications, etc.
  
  console.log(`Approval notification sent to ${usersToNotify.length} users`);
}

// ============================================
// APPROVAL UTILITIES
// ============================================

/**
 * Check if an action requires approval
 */
export function requiresApproval(
  toolName: string,
  autonomy: number,
  permission: string
): boolean {
  // Always require approval for irreversible actions
  const irreversibleActions = [
    "delete",
    "remove",
    "erase",
    "buy",
    "purchase",
    "send",
    "publish",
    "post",
    "commit",
    "push",
    "merge",
    "borrar",
    "eliminar",
    "comprar",
    "enviar",
    "publicar",
  ];

  const lowerToolName = toolName.toLowerCase();
  const isIrreversible = irreversibleActions.some((action) => 
    lowerToolName.includes(action)
  );

  if (isIrreversible) {
    return true;
  }

  // Check permission
  if (permission === "write_approval") {
    return true;
  }

  // Check autonomy level
  if (autonomy < 3) {
    return true;
  }

  return false;
}

/**
 * Get approval count for a workspace
 */
export async function getApprovalCount(workspaceId: string): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
}> {
  const [stats] = await db
    .select({
      pending: count().filter(eq(approvals.status, "pending")),
      approved: count().filter(eq(approvals.status, "approved")),
      rejected: count().filter(eq(approvals.status, "rejected")),
      expired: count().filter(eq(approvals.status, "expired")),
    })
    .from(approvals)
    .where(eq(approvals.workspaceId, workspaceId))
    .limit(1);

  return {
    pending: stats?.pending || 0,
    approved: stats?.approved || 0,
    rejected: stats?.rejected || 0,
    expired: stats?.expired || 0,
  };
}

// ============================================
// IMPORTS
// ============================================

import { lt } from "drizzle-orm";
import { queueAgentTurn } from "../queue";

// Re-export types
export type { Approval };
