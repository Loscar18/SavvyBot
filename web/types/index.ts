// Type definitions for SavvyBot

// ============================================
// USER & AUTH TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  workspaceId: string;
  role: "owner" | "admin" | "member";
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  googleId?: string;
  githubId?: string;
  passwordHash?: string;
  twoFactorSecret?: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

// ============================================
// WORKSPACE TYPES
// ============================================

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  stripeCustomerId?: string;
  timezone: string;
  theme: "light" | "dark";
  language: string;
  billingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  settingsCiphertext?: string;
}

export interface WorkspaceSettings {
  timezone: string;
  theme: "light" | "dark";
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
  privacy: {
    analytics: boolean;
    errorReporting: boolean;
  };
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  description?: string;
  maxAgents: number;
  maxIntegrations: number;
  monthlyTurns: number;
  priceMonthly: number;
  priceYearly: number;
  stripePriceId?: string;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  workspaceId: string;
  planId: string;
  stripeSubscriptionId?: string;
  status: "active" | "canceled" | "past_due" | "unpaid";
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// AGENT TYPES
// ============================================

export interface Agent {
  id: string;
  workspaceId: string;
  name: string;
  emoji?: string;
  color: string;
  role: string;
  personality?: string;
  instructions?: string;
  autonomy: 1 | 2 | 3;
  modelBaseUrl?: string;
  modelName: string;
  modelKeyCiphertext?: string;
  status: "active" | "paused" | "error";
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface AgentWithKey extends Agent {
  modelKey?: string; // Decrypted key (only server-side)
}

export interface AgentStatus {
  agentId: string;
  status: "online" | "working" | "paused" | "offline";
  currentTask?: string;
  lastActivityAt?: Date;
}

export interface AgentActivity {
  id: string;
  type: "turn" | "tool_call" | "routine";
  status: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

// ============================================
// GROUP TYPES
// ============================================

export interface Group {
  id: string;
  workspaceId: string;
  name: string;
  emoji?: string;
  color: string;
  mode: "todos" | "relevo";
  coordinatorId?: string; // Agent ID for relevo mode
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  id: string;
  groupId: string;
  agentId: string;
  muted: boolean;
  joinedAt: Date;
}

export interface GroupWithMembers extends Group {
  members: (GroupMember & { agent: Agent })[];
  coordinator?: Agent;
}

// ============================================
// CHAT TYPES
// ============================================

export interface Thread {
  id: string;
  workspaceId: string;
  title?: string;
  agentId?: string;
  groupId?: string;
  archived: boolean;
  pinned: boolean;
  lastMessageAt?: Date;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  threadId: string;
  authorType: "user" | "agent" | "system";
  authorId?: string;
  agentId?: string;
  content: string;
  modelUsed?: string;
  approvalId?: string;
  isStreaming: boolean;
  streamCompleted: boolean;
  toolCallId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage extends Message {
  thread: Thread;
  agent?: Agent;
  user?: User;
  approval?: Approval;
  files?: File[];
}

export interface ThreadWithMessages extends Thread {
  messages: Message[];
  agent?: Agent;
  group?: Group;
  lastMessage?: Message;
}

// ============================================
// MEMORY TYPES
// ============================================

export interface Memory {
  id: string;
  workspaceId: string;
  agentId?: string;
  scope: "global" | "agent" | "thread";
  type: "note" | "fact" | "instruction";
  text: string;
  sourceThreadId?: string;
  sourceMessageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SKILL TYPES
// ============================================

export interface Skill {
  id: string;
  agentId: string;
  name: string;
  goal: string;
  steps: string[];
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  knownErrors: string[];
  lastUsedAt?: Date;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// ROUTINE TYPES
// ============================================

export interface Routine {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  targetType: "agent" | "group";
  targetId: string;
  triggerType: "daily" | "weekly" | "hourly" | "manual" | "cron";
  triggerValue: string;
  action: string;
  autonomy: 1 | 2 | 3;
  enabled: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  consecutiveFailures: number;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutineLog {
  id: string;
  routineId: string;
  status: "success" | "failed" | "skipped";
  summary?: string;
  error?: string;
  startedAt: Date;
  finishedAt?: Date;
  createdAt: Date;
}

export interface RoutineWithLogs extends Routine {
  logs: RoutineLog[];
  target?: Agent | Group;
}

// ============================================
// INTEGRATION TYPES
// ============================================

export type IntegrationKind = "composio" | "mcp" | "api";
export type IntegrationStatus = "connected" | "disconnected" | "error" | "pending";

export interface Integration {
  id: string;
  workspaceId: string;
  kind: IntegrationKind;
  providerName: string;
  displayName?: string;
  description?: string;
  configCiphertext: string;
  status: IntegrationStatus;
  errorMessage?: string;
  lastCheckedAt?: Date;
  connectedAccountId?: string;
  mcpType?: "http" | "sse" | "stdio";
  mcpUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConfig {
  // Composio
  appId?: string;
  accountId?: string;
  
  // MCP
  url?: string;
  type?: "http" | "sse" | "stdio";
  
  // API
  baseUrl?: string;
  authType?: "bearer" | "header" | "query" | "none";
  authKey?: string;
  authValue?: string;
}

export interface APIEndpoint {
  id: string;
  integrationId: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description?: string;
  toolName?: string;
  toolDescription?: string;
  parametersSchema?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tool {
  name: string;
  description: string;
  parameters?: any;
  integrationId: string;
  integrationKind: IntegrationKind;
  integrationName: string;
  permission?: "read" | "write_approval" | "blocked";
}

export interface ToolPermission {
  id: string;
  agentId: string;
  integrationId: string;
  toolName: string;
  scope: "read" | "write_approval" | "blocked";
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// APPROVAL TYPES
// ============================================

export interface Approval {
  id: string;
  threadId: string;
  workspaceId: string;
  agentId?: string;
  toolName: string;
  integrationId?: string;
  payload: any;
  status: "pending" | "approved" | "rejected" | "expired";
  decidedBy?: string;
  decidedAt?: Date;
  decisionReason?: string;
  jobId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalWithDetails extends Approval {
  thread?: Thread;
  agent?: Agent;
  integration?: Integration;
  decidedByUser?: User;
}

// ============================================
// JOB TYPES
// ============================================

export type JobType = "turn" | "routine" | "tool_call" | "approval";
export type JobStatus = "queued" | "active" | "completed" | "failed" | "paused";

export interface Job {
  id: string;
  workspaceId: string;
  agentId?: string;
  threadId?: string;
  type: JobType;
  status: JobStatus;
  data: any;
  result?: any;
  error?: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobStep {
  id: string;
  jobId: string;
  stepNumber: number;
  type: "think" | "tool_call" | "observe" | "approval";
  action?: string;
  toolName?: string;
  payload?: any;
  result?: any;
  error?: string;
  status: "pending" | "completed" | "failed" | "skipped";
  createdAt: Date;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 
  | "approval_pending"
  | "task_completed"
  | "routine_executed"
  | "error"
  | "info";

export interface Notification {
  id: string;
  workspaceId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  pushToken?: string;
  pushSent: boolean;
  pushSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationWithUser extends Notification {
  user?: User;
}

// ============================================
// FILE TYPES
// ============================================

export interface File {
  id: string;
  workspaceId: string;
  threadId?: string;
  messageId?: string;
  agentId?: string;
  name: string;
  originalName?: string;
  mimeType?: string;
  size: number;
  path: string;
  url?: string;
  isPublic: boolean;
  createdAt: Date;
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId?: string;
  agentId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ============================================
// USAGE TYPES
// ============================================

export interface UsageEvent {
  id: string;
  workspaceId: string;
  kind: string;
  agentId?: string;
  modelUsed?: string;
  tokensInput?: number;
  tokensOutput?: number;
  metadata?: any;
  createdAt: Date;
}

export interface UsageSummary {
  id: string;
  workspaceId: string;
  month: string;
  turnsUsed: number;
  tokensUsed: number;
  toolsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageStats {
  turns: {
    used: number;
    limit: number;
    percentage: number;
  };
  tokens: {
    used: number;
    limit: number;
    percentage: number;
  };
  tools: {
    used: number;
    limit: number;
    percentage: number;
  };
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardStats {
  agents: {
    total: number;
    active: number;
    paused: number;
  };
  threads: {
    total: number;
    unread: number;
    archived: number;
  };
  integrations: {
    total: number;
    connected: number;
    byKind: Record<IntegrationKind, number>;
  };
  usage: UsageStats;
  activity: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

export interface ActivityData {
  date: string;
  turns: number;
  tools: number;
  tokens: number;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface AppSettings {
  // General
  timezone: string;
  language: string;
  theme: "light" | "dark" | "system";
  
  // Notifications
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  
  // Privacy
  privacy: {
    analytics: boolean;
    errorReporting: boolean;
  };
  
  // Billing
  billing: {
    enabled: boolean;
    stripeCustomerId?: string;
    subscriptionId?: string;
  };
  
  // Model settings
  model: {
    defaultModel: string;
    defaultBaseUrl?: string;
    apiKey?: string; // Encrypted
  };
  
  // Composio settings
  composio: {
    apiKey?: string; // Encrypted
  };
  
  // Stripe settings
  stripe: {
    secretKey?: string; // Encrypted
    webhookSecret?: string; // Encrypted
  };
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  warnings?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  filter?: Record<string, any>;
}

// ============================================
// SEARCH TYPES
// ============================================

export interface SearchResult {
  id: string;
  type: "agent" | "thread" | "memory" | "skill" | "integration" | "file";
  title: string;
  description?: string;
  url: string;
  score: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SearchParams {
  query: string;
  types?: string[];
  limit?: number;
  workspaceId: string;
}

// ============================================
// EXPORT TYPES
// ============================================

export type {
  // User & Auth
  User,
  UserProfile,
  Session,
  AuthState,
  
  // Workspace
  Workspace,
  WorkspaceSettings,
  Plan,
  Subscription,
  
  // Agent
  Agent,
  AgentWithKey,
  AgentStatus,
  AgentActivity,
  
  // Group
  Group,
  GroupMember,
  GroupWithMembers,
  
  // Chat
  Thread,
  Message,
  ChatMessage,
  ThreadWithMessages,
  
  // Memory
  Memory,
  
  // Skill
  Skill,
  
  // Routine
  Routine,
  RoutineLog,
  RoutineWithLogs,
  
  // Integration
  Integration,
  IntegrationConfig,
  APIEndpoint,
  Tool,
  ToolPermission,
  
  // Approval
  Approval,
  ApprovalWithDetails,
  
  // Job
  Job,
  JobStep,
  
  // Notification
  Notification,
  NotificationWithUser,
  
  // File
  File,
  
  // Audit Log
  AuditLog,
  
  // Usage
  UsageEvent,
  UsageSummary,
  UsageStats,
  
  // Dashboard
  DashboardStats,
  ActivityData,
  
  // Settings
  AppSettings,
  
  // API
  APIResponse,
  PaginatedResponse,
  PaginationParams,
  
  // Search
  SearchResult,
  SearchParams,
};
