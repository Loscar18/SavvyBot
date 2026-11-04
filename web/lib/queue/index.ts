import { Queue, Worker, Job, QueueOptions, WorkerOptions } from "bullmq";
import IORedis from "ioredis";
import { db } from "../db";
import { jobs, jobSteps, agents, workspaces, approvals, threads, messages } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { encrypt, decrypt } from "../crypto";
import { createAgentContext, executeAgentTurn } from "../agents";
import { getIntegrationById, callTool } from "../integrations";

// Redis connection
const redisConnection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379/0", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Queue names
export const QUEUE_NAMES = {
  AGENT_TURNS: "agentTurns",
  ROUTINES: "routines",
  TOOL_CALLS: "toolCalls",
  APPROVALS: "approvals",
  NOTIFICATIONS: "notifications",
} as const;

type QueueName = keyof typeof QUEUE_NAMES;

// Queue instances
const queues: Record<QueueName, Queue> = {} as Record<QueueName, Queue>;

/**
 * Initialize all queues
 */
export function initializeQueues() {
  Object.entries(QUEUE_NAMES).forEach(([name, queueName]) => {
    const queue = new Queue(queueName, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: 1000, // Keep completed jobs for 1000 seconds
        removeOnFail: 5000,
      },
    });
    queues[name as QueueName] = queue;
  });
  
  console.log("✅ Queues initialized");
}

/**
 * Get a queue by name
 */
export function getQueue(name: QueueName): Queue {
  return queues[name];
}

/**
 * Add a job to a queue
 */
export async function addJob(
  queueName: QueueName,
  data: any,
  options?: Partial<QueueOptions>
): Promise<Job> {
  const queue = getQueue(queueName);
  return await queue.add("job", data, options);
}

// ============================================
// AGENT TURN QUEUE
// ============================================

/**
 * Add an agent turn job to the queue
 */
export async function queueAgentTurn(
  workspaceId: string,
  agentId: string,
  threadId: string,
  userMessage: string,
  options?: {
    priority?: number;
    delay?: number;
  }
): Promise<Job> {
  const queue = getQueue("AGENT_TURNS");
  
  return await queue.add(
    "agentTurn",
    {
      workspaceId,
      agentId,
      threadId,
      userMessage,
      timestamp: new Date().toISOString(),
    },
    {
      priority: options?.priority || 0,
      delay: options?.delay || 0,
      jobId: `agentTurn:${workspaceId}:${threadId}:${Date.now()}`,
    }
  );
}

/**
 * Process agent turn job
 */
export async function processAgentTurn(job: Job) {
  const { workspaceId, agentId, threadId, userMessage } = job.data;
  
  try {
    // Get agent and workspace
    const [agent] = await db
      .select({
        id: agents.id,
        name: agents.name,
        autonomy: agents.autonomy,
        modelBaseUrl: agents.modelBaseUrl,
        modelName: agents.modelName,
        modelKeyCiphertext: agents.modelKeyCiphertext,
        instructions: agents.instructions,
        personality: agents.personality,
        status: agents.status,
      })
      .from(agents)
      .where(and(
        eq(agents.id, agentId),
        eq(agents.workspaceId, workspaceId)
      ))
      .limit(1);

    if (!agent) {
      throw new Error("Agent not found");
    }

    // Get workspace
    const [workspace] = await db
      .select({
        id: workspaces.id,
        plan: workspaces.plan,
        timezone: workspaces.timezone,
      })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Check rate limits
    const { allowed } = await checkWorkspaceLimits(workspaceId, "turns");
    if (!allowed) {
      throw new Error("Rate limit exceeded");
    }

    // Create job record in database
    const [jobRecord] = await db
      .insert(jobs)
      .values({
        workspaceId,
        agentId,
        threadId,
        type: "turn",
        status: "active",
        data: {
          userMessage,
          agentId,
          threadId,
        },
      })
      .returning();

    // Execute agent turn
    const result = await executeAgentTurn({
      workspaceId,
      agent,
      threadId,
      userMessage,
      jobId: jobRecord.id,
    });

    // Update job record
    await db
      .update(jobs)
      .set({
        status: "completed",
        result,
        completedAt: new Date(),
      })
      .where(eq(jobs.id, jobRecord.id));

    // Record usage
    await db.insert(usageEvents).values({
      workspaceId,
      kind: "turn",
      agentId,
      modelUsed: agent.modelName,
      createdAt: new Date(),
    });

    return result;
  } catch (error) {
    console.error("Agent turn failed:", error);
    
    // Update job record with error
    await db
      .update(jobs)
      .set({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        failedAt: new Date(),
      })
      .where(and(
        eq(jobs.workspaceId, workspaceId),
        eq(jobs.agentId, agentId),
        eq(jobs.threadId, threadId),
        eq(jobs.type, "turn")
      ));

    throw error;
  }
}

// ============================================
// ROUTINE QUEUE
// ============================================

/**
 * Add a routine execution job
 */
export async function queueRoutine(
  routineId: string,
  workspaceId: string
): Promise<Job> {
  const queue = getQueue("ROUTINES");
  
  return await queue.add(
    "routine",
    {
      routineId,
      workspaceId,
      timestamp: new Date().toISOString(),
    },
    {
      jobId: `routine:${routineId}:${Date.now()}`,
    }
  );
}

/**
 * Process routine job
 */
export async function processRoutine(job: Job) {
  const { routineId, workspaceId } = job.data;
  
  try {
    // Get routine
    const [routine] = await db
      .select({
        id: routines.id,
        name: routines.name,
        targetType: routines.targetType,
        targetId: routines.targetId,
        action: routines.action,
        autonomy: routines.autonomy,
      })
      .from(routines)
      .where(and(
        eq(routines.id, routineId),
        eq(routines.workspaceId, workspaceId)
      ))
      .limit(1);

    if (!routine) {
      throw new Error("Routine not found");
    }

    // Execute routine action
    // This would call the agent or group with the specified action
    
    // Record log
    await db.insert(routineLogs).values({
      routineId,
      status: "success",
      summary: `Routine ${routine.name} executed successfully`,
      startedAt: new Date(),
      finishedAt: new Date(),
    });

    // Update routine
    await db
      .update(routines)
      .set({
        lastRunAt: new Date(),
        consecutiveFailures: 0,
        nextRunAt: calculateNextRun(routine),
      })
      .where(eq(routines.id, routineId));

    return { success: true };
  } catch (error) {
    console.error("Routine failed:", error);
    
    // Record failure
    await db.insert(routineLogs).values({
      routineId,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      startedAt: new Date(),
      finishedAt: new Date(),
    });

    // Update consecutive failures
    await db
      .update(routines)
      .set({
        consecutiveFailures: sql`${routines.consecutiveFailures} + 1`,
      })
      .where(eq(routines.id, routineId));

    // Auto-pause after 2 consecutive failures
    const [routine] = await db
      .select({ consecutiveFailures: routines.consecutiveFailures })
      .from(routines)
      .where(eq(routines.id, routineId))
      .limit(1);

    if (routine?.consecutiveFailures >= 2) {
      await db
        .update(routines)
        .set({ enabled: false })
        .where(eq(routines.id, routineId));
    }

    throw error;
  }
}

/**
 * Calculate next run time for a routine
 */
function calculateNextRun(routine: any): Date {
  const now = new Date();
  
  switch (routine.triggerType) {
    case "daily":
      const [hours, minutes] = routine.triggerValue.split(":").map(Number);
      const nextRun = new Date(now);
      nextRun.setHours(hours, minutes, 0, 0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      return nextRun;
    case "weekly":
      const [day, time] = routine.triggerValue.split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      const dayIndex = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(day.toLowerCase());
      const nextRun = new Date(now);
      nextRun.setHours(hours, minutes, 0, 0);
      nextRun.setDate(now.getDate() + ((dayIndex - now.getDay() + 7) % 7));
      return nextRun;
    case "hourly":
      const nextRun = new Date(now);
      nextRun.setHours(now.getHours() + 1, 0, 0, 0);
      return nextRun;
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

// ============================================
// TOOL CALL QUEUE
// ============================================

/**
 * Add a tool call job
 */
export async function queueToolCall(
  workspaceId: string,
  agentId: string,
  threadId: string,
  toolName: string,
  integrationId: string,
  payload: any,
  jobId: string
): Promise<Job> {
  const queue = getQueue("TOOL_CALLS");
  
  return await queue.add(
    "toolCall",
    {
      workspaceId,
      agentId,
      threadId,
      toolName,
      integrationId,
      payload,
      jobId,
      timestamp: new Date().toISOString(),
    },
    {
      jobId: `toolCall:${jobId}:${Date.now()}`,
    }
  );
}

/**
 * Process tool call job
 */
export async function processToolCall(job: Job) {
  const { workspaceId, agentId, threadId, toolName, integrationId, payload, jobId } = job.data;
  
  try {
    // Get integration
    const integration = await getIntegrationById(integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    // Check tool permissions
    const [permission] = await db
      .select({
        scope: toolPermissions.scope,
      })
      .from(toolPermissions)
      .where(and(
        eq(toolPermissions.agentId, agentId),
        eq(toolPermissions.integrationId, integrationId),
        eq(toolPermissions.toolName, toolName)
      ))
      .limit(1);

    if (!permission || permission.scope === "blocked") {
      throw new Error("Tool access blocked");
    }

    // Check if approval is needed
    if (permission.scope === "write_approval") {
      // Create approval request
      const [approval] = await db
        .insert(approvals)
        .values({
          threadId,
          workspaceId,
          agentId,
          toolName,
          integrationId,
          payload,
          status: "pending",
          jobId,
        })
        .returning();

      // Pause the job and wait for approval
      // In a real implementation, we'd use BullMQ's pause/resume or custom job states
      return {
        status: "pending_approval",
        approvalId: approval.id,
      };
    }

    // Call the tool
    const result = await callTool(integrationId, toolName, payload);

    // Record step
    await db.insert(jobSteps).values({
      jobId,
      stepNumber: 1,
      type: "tool_call",
      toolName,
      payload,
      result,
      status: "completed",
    });

    return result;
  } catch (error) {
    console.error("Tool call failed:", error);
    
    // Record error step
    await db.insert(jobSteps).values({
      jobId,
      stepNumber: 1,
      type: "tool_call",
      toolName,
      payload,
      error: error instanceof Error ? error.message : "Unknown error",
      status: "failed",
    });

    throw error;
  }
}

// ============================================
// NOTIFICATION QUEUE
// ============================================

/**
 * Add a notification job
 */
export async function queueNotification(
  workspaceId: string,
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: any
): Promise<Job> {
  const queue = getQueue("NOTIFICATIONS");
  
  return await queue.add(
    "notification",
    {
      workspaceId,
      userId,
      type,
      title,
      message,
      data,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Process notification job
 */
export async function processNotification(job: Job) {
  const { workspaceId, userId, type, title, message, data } = job.data;
  
  try {
    // Store notification in database
    await db.insert(notifications).values({
      workspaceId,
      userId,
      type: type as any,
      title,
      message,
      data,
    });

    // In a real implementation, we'd also send push notifications here
    return { success: true };
  } catch (error) {
    console.error("Notification failed:", error);
    throw error;
  }
}

// ============================================
// QUEUE WORKERS
// ============================================

/**
 * Create workers for all queues
 */
export function createWorkers() {
  // Agent turns worker
  const agentTurnsWorker = new Worker(
    QUEUE_NAMES.AGENT_TURNS,
    async (job) => {
      await processAgentTurn(job);
    },
    {
      connection: redisConnection,
      concurrency: 10, // Limit concurrent agent turns per worker
    }
  );

  // Routines worker
  const routinesWorker = new Worker(
    QUEUE_NAMES.ROUTINES,
    async (job) => {
      await processRoutine(job);
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  // Tool calls worker
  const toolCallsWorker = new Worker(
    QUEUE_NAMES.TOOL_CALLS,
    async (job) => {
      await processToolCall(job);
    },
    {
      connection: redisConnection,
      concurrency: 20,
    }
  );

  // Notifications worker
  const notificationsWorker = new Worker(
    QUEUE_NAMES.NOTIFICATIONS,
    async (job) => {
      await processNotification(job);
    },
    {
      connection: redisConnection,
      concurrency: 10,
    }
  );

  // Error handlers
  agentTurnsWorker.on("failed", (job, err) => {
    console.error(`Agent turn job ${job?.id} failed:`, err);
  });

  routinesWorker.on("failed", (job, err) => {
    console.error(`Routine job ${job?.id} failed:`, err);
  });

  toolCallsWorker.on("failed", (job, err) => {
    console.error(`Tool call job ${job?.id} failed:`, err);
  });

  notificationsWorker.on("failed", (job, err) => {
    console.error(`Notification job ${job?.id} failed:`, err);
  });

  console.log("✅ Workers created");

  return {
    agentTurnsWorker,
    routinesWorker,
    toolCallsWorker,
    notificationsWorker,
  };
}

// ============================================
// QUEUE MONITORING
// ============================================

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const stats = {} as Record<string, any>;
  
  for (const [name, queueName] of Object.entries(QUEUE_NAMES)) {
    const queue = getQueue(name as QueueName);
    const queueStats = await queue.getJobCounts();
    
    stats[name] = {
      ...queueStats,
      name: queueName,
    };
  }
  
  return stats;
}

/**
 * Get active jobs
 */
export async function getActiveJobs(workspaceId: string) {
  const [jobsList] = await db
    .select({
      id: jobs.id,
      type: jobs.type,
      status: jobs.status,
      createdAt: jobs.createdAt,
      agent: {
        id: agents.id,
        name: agents.name,
      },
      thread: {
        id: threads.id,
        title: threads.title,
      },
    })
    .from(jobs)
    .leftJoin(agents, eq(jobs.agentId, agents.id))
    .leftJoin(threads, eq(jobs.threadId, threads.id))
    .where(eq(jobs.workspaceId, workspaceId))
    .orderBy(desc(jobs.createdAt))
    .limit(50);

  return jobsList || [];
}

// ============================================
// IMPORTS
// ============================================

import { sql } from "drizzle-orm";
import { routines, toolPermissions, notifications, jobSteps } from "../db/schema";
import { checkWorkspaceLimits } from "../auth";
import { getIntegrationById, callTool } from "../integrations";
import { executeAgentTurn } from "../agents";

// Re-export queue names
export { QUEUE_NAMES };
