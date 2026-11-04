import { pgTable, pgSchema, uuid, text, timestamp, boolean, integer, jsonb, varchar, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// SCHEMA DEFINITION
// ============================================

// Multi-tenant schema - all tables have workspaceId for RLS
// Row-Level Security will be configured in migrations

// ============================================
// USERS & WORKSPACES
// ============================================

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  plan: varchar("plan", { length: 20 }).default("free"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  timezone: varchar("timezone", { length: 50 }).default("Europe/Madrid"),
  theme: varchar("theme", { length: 20 }).default("light"),
  language: varchar("language", { length: 10 }).default("es"),
  billingEnabled: boolean("billing_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Encrypted settings
  settingsCiphertext: text("settings_ciphertext"),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  avatar: text("avatar"),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { length: 20 }).default("owner").$type<"owner" | "admin" | "member">(),
  emailVerified: boolean("email_verified").default(false),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: varchar("two_factor_secret", { length: 255 }),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // OAuth providers
  googleId: varchar("google_id", { length: 255 }),
  githubId: varchar("github_id", { length: 255 }),
});

// User sessions
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// PLANS & SUBSCRIPTIONS
// ============================================

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  maxAgents: integer("max_agents").default(1),
  maxIntegrations: integer("max_integrations").default(2),
  monthlyTurns: integer("monthly_turns").default(50),
  priceMonthly: integer("price_monthly").default(0),
  priceYearly: integer("price_yearly").default(0),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  features: jsonb("features").$type<string[]>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscriptions (when billing is enabled)
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  planId: uuid("plan_id").references(() => plans.id),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  status: varchar("status", { length: 20 }).default("active").$type<"active" | "canceled" | "past_due" | "unpaid">(),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Usage tracking
export const usageEvents = pgTable("usage_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  kind: varchar("kind", { length: 50 }).notNull(), // turn, tool_call, approval, etc.
  agentId: uuid("agent_id"),
  modelUsed: varchar("model_used", { length: 100 }),
  tokensInput: integer("tokens_input"),
  tokensOutput: integer("tokens_output"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Monthly usage summary
export const usageSummary = pgTable("usage_summary", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  turnsUsed: integer("turns_used").default(0),
  tokensUsed: integer("tokens_used").default(0),
  toolsUsed: integer("tools_used").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// AGENTS
// ============================================

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  emoji: varchar("emoji", { length: 10 }),
  color: varchar("color", { length: 20 }).default("#FF7A29"),
  role: varchar("role", { length: 100 }).notNull(),
  personality: text("personality"),
  instructions: text("instructions"),
  autonomy: integer("autonomy").default(2).$type<1 | 2 | 3>(),
  // Model configuration (BYOK)
  modelBaseUrl: text("model_base_url"),
  modelName: varchar("model_name", { length: 100 }).default("grok"),
  modelKeyCiphertext: text("model_key_ciphertext"), // Encrypted API key
  // Status
  status: varchar("status", { length: 20 }).default("active").$type<"active" | "paused" | "error">(),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Metadata
  metadata: jsonb("metadata"),
});

// ============================================
// GROUPS
// ============================================

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  emoji: varchar("emoji", { length: 10 }),
  color: varchar("color", { length: 20 }).default("#FF7A29"),
  mode: varchar("mode", { length: 20 }).default("todos").$type<"todos" | "relevo">(),
  coordinatorId: uuid("coordinator_id"), // Agent ID for relevo mode
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Group members (agents in the group)
export const groupMembers = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }).notNull(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
  muted: boolean("muted").default(false),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => {
  return [
    primaryKey({ columns: [table.groupId, table.agentId] }),
  ];
});

// ============================================
// CHAT: THREADS & MESSAGES
// ============================================

export const threads = pgTable("threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 500 }),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),
  archived: boolean("archived").default(false),
  pinned: boolean("pinned").default(false),
  lastMessageAt: timestamp("last_message_at"),
  unreadCount: integer("unread_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").references(() => threads.id, { onDelete: "cascade" }).notNull(),
  authorType: varchar("author_type", { length: 20 }).notNull().$type<"user" | "agent">(),
  authorId: uuid("author_id"), // userId or agentId
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  modelUsed: varchar("model_used", { length: 100 }),
  approvalId: uuid("approval_id").references(() => approvals.id, { onDelete: "set null" }),
  // For streaming
  isStreaming: boolean("is_streaming").default(false),
  streamCompleted: boolean("stream_completed").default(false),
  // For tool calls
  toolCallId: uuid("tool_call_id"),
  // Metadata
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// MEMORIES
// ============================================

export const memories = pgTable("memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
  scope: varchar("scope", { length: 20 }).default("global").$type<"global" | "agent" | "thread">(),
  type: varchar("type", { length: 20 }).default("note").$type<"note" | "fact" | "instruction">(),
  text: text("text").notNull(),
  // For auto-summaries
  sourceThreadId: uuid("source_thread_id"),
  sourceMessageId: uuid("source_message_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// SKILLS
// ============================================

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  goal: text("goal").notNull(),
  steps: jsonb("steps").$type<string[]>(),
  inputs: jsonb("inputs").$type<Record<string, string>>(),
  outputs: jsonb("outputs").$type<Record<string, string>>(),
  knownErrors: jsonb("known_errors").$type<string[]>(),
  // Execution
  lastUsedAt: timestamp("last_used_at"),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// ROUTINES
// ============================================

export const routines = pgTable("routines", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetType: varchar("target_type", { length: 20 }).notNull().$type<"agent" | "group">(),
  targetId: uuid("target_id").notNull(), // agentId or groupId
  triggerType: varchar("trigger_type", { length: 20 }).notNull().$type<"daily" | "weekly" | "hourly" | "manual" | "cron">(),
  triggerValue: text("trigger_value").notNull(), // time, day, cron expression
  action: text("action").notNull(), // What the routine does
  autonomy: integer("autonomy").default(2).$type<1 | 2 | 3>(),
  enabled: boolean("enabled").default(true),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  consecutiveFailures: integer("consecutive_failures").default(0),
  // Quiet hours
  quietHoursEnabled: boolean("quiet_hours_enabled").default(false),
  quietHoursStart: varchar("quiet_hours_start", { length: 5 }), // HH:MM
  quietHoursEnd: varchar("quiet_hours_end", { length: 5 }), // HH:MM
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Routine execution logs
export const routineLogs = pgTable("routine_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  routineId: uuid("routine_id").references(() => routines.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status", { length: 20 }).notNull().$type<"success" | "failed" | "skipped">(),
  summary: text("summary"),
  error: text("error"),
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// INTEGRATIONS
// ============================================

export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  kind: varchar("kind", { length: 20 }).notNull().$type<"composio" | "mcp" | "api">(),
  providerName: varchar("provider_name", { length: 100 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  description: text("description"),
  // Encrypted configuration
  configCiphertext: text("config_ciphertext").notNull(),
  // Status
  status: varchar("status", { length: 20 }).default("disconnected").$type<"connected" | "disconnected" | "error" | "pending">(),
  errorMessage: text("error_message"),
  lastCheckedAt: timestamp("last_checked_at"),
  connectedAccountId: varchar("connected_account_id", { length: 255 }),
  // For MCPs
  mcpType: varchar("mcp_type", { length: 20 }).$type<"http" | "sse" | "stdio">(),
  mcpUrl: text("mcp_url"),
  // Metadata
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// API endpoints for custom integrations
export const apiEndpoints = pgTable("api_endpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  integrationId: uuid("integration_id").references(() => integrations.id, { onDelete: "cascade" }).notNull(),
  method: varchar("method", { length: 10 }).notNull().$type<"GET" | "POST" | "PUT" | "DELETE" | "PATCH">(),
  path: varchar("path", { length: 500 }).notNull(),
  description: text("description"),
  // Tool definition for agents
  toolName: varchar("tool_name", { length: 255 }),
  toolDescription: text("tool_description"),
  parametersSchema: jsonb("parameters_schema"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// TOOL PERMISSIONS
// ============================================

export const toolPermissions = pgTable("tool_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
  integrationId: uuid("integration_id").references(() => integrations.id, { onDelete: "cascade" }).notNull(),
  toolName: varchar("tool_name", { length: 255 }).notNull(),
  scope: varchar("scope", { length: 20 }).default("read").$type<"read" | "write_approval" | "blocked">(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return [
    primaryKey({ columns: [table.agentId, table.integrationId, table.toolName] }),
  ];
});

// ============================================
// APPROVALS
// ============================================

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").references(() => threads.id, { onDelete: "cascade" }).notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
  toolName: varchar("tool_name", { length: 255 }).notNull(),
  integrationId: uuid("integration_id").references(() => integrations.id, { onDelete: "set null" }),
  payload: jsonb("payload").notNull(), // The exact action to be approved
  status: varchar("status", { length: 20 }).default("pending").$type<"pending" | "approved" | "rejected" | "expired">(),
  decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
  decidedAt: timestamp("decided_at"),
  decisionReason: text("decision_reason"),
  // Job reference
  jobId: varchar("job_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// JOBS (for BullMQ)
// ============================================

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
  threadId: uuid("thread_id").references(() => threads.id, { onDelete: "set null" }),
  type: varchar("type", { length: 50 }).notNull(), // turn, routine, tool_call
  status: varchar("status", { length: 20 }).default("queued").$type<"queued" | "active" | "completed" | "failed" | "paused">(),
  data: jsonb("data").notNull(),
  result: jsonb("result"),
  error: text("error"),
  priority: integer("priority").default(0),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  failedAt: timestamp("failed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Job steps (for agent turns)
export const jobSteps = pgTable("job_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  stepNumber: integer("step_number").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // think, tool_call, observe, approval
  action: text("action"),
  toolName: varchar("tool_name", { length: 255 }),
  payload: jsonb("payload"),
  result: jsonb("result"),
  error: text("error"),
  status: varchar("status", { length: 20 }).default("pending").$type<"pending" | "completed" | "failed" | "skipped">(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 50 }).notNull().$type<"approval_pending" | "task_completed" | "routine_executed" | "error" | "info">(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  read: boolean("read").default(false),
  // For push notifications
  pushToken: varchar("push_token", { length: 255 }),
  pushSent: boolean("push_sent").default(false),
  pushSentAt: timestamp("push_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// FILES / ATTACHMENTS
// ============================================

export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  threadId: uuid("thread_id").references(() => threads.id, { onDelete: "set null" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
  name: varchar("name", { length: 500 }).notNull(),
  originalName: varchar("original_name", { length: 500 }),
  mimeType: varchar("mime_type", { length: 100 }),
  size: integer("size").notNull(),
  path: text("path").notNull(), // Storage path
  url: text("url"),
  // Security
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// AUDIT LOG
// ============================================

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id"),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// RELATIONS
// ============================================

// Workspace relations
export const workspaceRelations = relations(workspaces, ({ many }) => ({
  users: many(users),
  agents: many(agents),
  groups: many(groups),
  threads: many(threads),
  memories: many(memories),
  routines: many(routines),
  integrations: many(integrations),
  usageEvents: many(usageEvents),
  usageSummary: many(usageSummary),
  subscriptions: many(subscriptions),
  notifications: many(notifications),
  files: many(files),
  auditLogs: many(auditLogs),
  approvals: many(approvals),
  jobs: many(jobs),
}));

// User relations
export const userRelations = relations(users, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [users.workspaceId],
    references: [workspaces.id],
  }),
  sessions: many(sessions),
  passwordResetTokens: many(passwordResetTokens),
  emailVerificationTokens: many(emailVerificationTokens),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
  threads: many(threads),
  messages: many(messages),
  approvals: many(approvals),
}));

// Agent relations
export const agentRelations = relations(agents, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [agents.workspaceId],
    references: [workspaces.id],
  }),
  threads: many(threads),
  messages: many(messages),
  memories: many(memories),
  skills: many(skills),
  groupMembers: many(groupMembers),
  toolPermissions: many(toolPermissions),
  jobs: many(jobs),
  auditLogs: many(auditLogs),
  approvals: many(approvals),
  files: many(files),
  // Coordinator for groups
  coordinatedGroups: many(groups),
  // Routines targeting this agent
  routines: many(routines),
}));

// Group relations
export const groupRelations = relations(groups, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [groups.workspaceId],
    references: [workspaces.id],
  }),
  coordinator: one(agents, {
    fields: [groups.coordinatorId],
    references: [agents.id],
  }),
  members: many(groupMembers),
  threads: many(threads),
  routines: many(routines),
}));

// Group member relations
export const groupMemberRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  agent: one(agents, {
    fields: [groupMembers.agentId],
    references: [agents.id],
  }),
}));

// Thread relations
export const threadRelations = relations(threads, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [threads.workspaceId],
    references: [workspaces.id],
  }),
  agent: one(agents, {
    fields: [threads.agentId],
    references: [agents.id],
  }),
  group: one(groups, {
    fields: [threads.groupId],
    references: [groups.id],
  }),
  messages: many(messages),
  files: many(files),
}));

// Message relations
export const messageRelations = relations(messages, ({ one, many }) => ({
  thread: one(threads, {
    fields: [messages.threadId],
    references: [threads.id],
  }),
  agent: one(agents, {
    fields: [messages.agentId],
    references: [agents.id],
  }),
  approval: one(approvals, {
    fields: [messages.approvalId],
    references: [approvals.id],
  }),
  files: many(files),
}));

// Memory relations
export const memoryRelations = relations(memories, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [memories.workspaceId],
    references: [workspaces.id],
  }),
  agent: one(agents, {
    fields: [memories.agentId],
    references: [agents.id],
  }),
  sourceThread: one(threads, {
    fields: [memories.sourceThreadId],
    references: [threads.id],
  }),
}));

// Skill relations
export const skillRelations = relations(skills, ({ one }) => ({
  agent: one(agents, {
    fields: [skills.agentId],
    references: [agents.id],
  }),
}));

// Routine relations
export const routineRelations = relations(routines, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [routines.workspaceId],
    references: [workspaces.id],
  }),
  targetAgent: one(agents, {
    fields: [routines.targetId],
    references: [agents.id],
  }),
  targetGroup: one(groups, {
    fields: [routines.targetId],
    references: [groups.id],
  }),
  logs: many(routineLogs),
}));

// Integration relations
export const integrationRelations = relations(integrations, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [integrations.workspaceId],
    references: [workspaces.id],
  }),
  endpoints: many(apiEndpoints),
  toolPermissions: many(toolPermissions),
  approvals: many(approvals),
}));

// API endpoint relations
export const apiEndpointRelations = relations(apiEndpoints, ({ one }) => ({
  integration: one(integrations, {
    fields: [apiEndpoints.integrationId],
    references: [integrations.id],
  }),
}));

// Tool permission relations
export const toolPermissionRelations = relations(toolPermissions, ({ one }) => ({
  agent: one(agents, {
    fields: [toolPermissions.agentId],
    references: [agents.id],
  }),
  integration: one(integrations, {
    fields: [toolPermissions.integrationId],
    references: [integrations.id],
  }),
}));

// Approval relations
export const approvalRelations = relations(approvals, ({ one, many }) => ({
  thread: one(threads, {
    fields: [approvals.threadId],
    references: [threads.id],
  }),
  workspace: one(workspaces, {
    fields: [approvals.workspaceId],
    references: [workspaces.id],
  }),
  agent: one(agents, {
    fields: [approvals.agentId],
    references: [agents.id],
  }),
  integration: one(integrations, {
    fields: [approvals.integrationId],
    references: [integrations.id],
  }),
  decidedBy: one(users, {
    fields: [approvals.decidedBy],
    references: [users.id],
  }),
  messages: many(messages),
}));

// Job relations
export const jobRelations = relations(jobs, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [jobs.workspaceId],
    references: [workspaces.id],
  }),
  agent: one(agents, {
    fields: [jobs.agentId],
    references: [agents.id],
  }),
  thread: one(threads, {
    fields: [jobs.threadId],
    references: [threads.id],
  }),
  steps: many(jobSteps),
}));

// Job step relations
export const jobStepRelations = relations(jobSteps, ({ one }) => ({
  job: one(jobs, {
    fields: [jobSteps.jobId],
    references: [jobs.id],
  }),
}));

// Notification relations
export const notificationRelations = relations(notifications, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [notifications.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// File relations
export const fileRelations = relations(files, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [files.workspaceId],
    references: [workspaces.id],
  }),
  thread: one(threads, {
    fields: [files.threadId],
    references: [threads.id],
  }),
  message: one(messages, {
    fields: [files.messageId],
    references: [messages.id],
  }),
  agent: one(agents, {
    fields: [files.agentId],
    references: [agents.id],
  }),
}));

// Audit log relations
export const auditLogRelations = relations(auditLogs, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [auditLogs.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [auditLogs.agentId],
    references: [agents.id],
  }),
}));

// Plan relations
export const planRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

// Subscription relations
export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [subscriptions.workspaceId],
    references: [workspaces.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
}));

// Usage event relations
export const usageEventRelations = relations(usageEvents, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [usageEvents.workspaceId],
    references: [workspaces.id],
  }),
  agent: one(agents, {
    fields: [usageEvents.agentId],
    references: [agents.id],
  }),
}));

// Usage summary relations
export const usageSummaryRelations = relations(usageSummary, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [usageSummary.workspaceId],
    references: [workspaces.id],
  }),
}));

// Session relations
export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Password reset token relations
export const passwordResetTokenRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// Email verification token relations
export const emailVerificationTokenRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id],
  }),
}));

// Routine log relations
export const routineLogRelations = relations(routineLogs, ({ one }) => ({
  routine: one(routines, {
    fields: [routineLogs.routineId],
    references: [routines.id],
  }),
}));

// Export all tables for Drizzle
export const allTables = {
  workspaces,
  users,
  sessions,
  passwordResetTokens,
  emailVerificationTokens,
  plans,
  subscriptions,
  usageEvents,
  usageSummary,
  agents,
  groups,
  groupMembers,
  threads,
  messages,
  memories,
  skills,
  routines,
  routineLogs,
  integrations,
  apiEndpoints,
  toolPermissions,
  approvals,
  jobs,
  jobSteps,
  notifications,
  files,
  auditLogs,
};

// Export all relations
export const allRelations = {
  workspaceRelations,
  userRelations,
  agentRelations,
  groupRelations,
  groupMemberRelations,
  threadRelations,
  messageRelations,
  memoryRelations,
  skillRelations,
  routineRelations,
  integrationRelations,
  apiEndpointRelations,
  toolPermissionRelations,
  approvalRelations,
  jobRelations,
  jobStepRelations,
  notificationRelations,
  fileRelations,
  auditLogRelations,
  planRelations,
  subscriptionRelations,
  usageEventRelations,
  usageSummaryRelations,
  sessionRelations,
  passwordResetTokenRelations,
  emailVerificationTokenRelations,
  routineLogRelations,
};
