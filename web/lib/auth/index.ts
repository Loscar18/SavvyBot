import { SignJWT, jwtVerify } from "jose";
import { db } from "../db";
import { users, sessions, workspaces } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { generateToken } from "../crypto";
import { TRPCError } from "@trpc/server";

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_ISSUER = "savvybot";
const JWT_AUDIENCE = "savvybot-app";

// Token durations
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days
const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

// Token types
export type TokenType = "access" | "refresh" | "email_verification" | "password_reset";

// Session type
export interface Session {
  id: string;
  userId: string;
  workspaceId: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

// Auth user type
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  workspaceId: string;
  role: "owner" | "admin" | "member";
  avatar?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

/**
 * Create JWT token
 */
export async function createToken(
  userId: string,
  workspaceId: string,
  type: TokenType = "access",
  expiresIn: string = ACCESS_TOKEN_EXPIRY
): Promise<string> {
  const secret = type === "refresh" ? JWT_REFRESH_SECRET : JWT_SECRET;
  
  const token = await new SignJWT({
    userId,
    workspaceId,
    type,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));

  return token;
}

/**
 * Verify JWT token
 */
export async function verifyToken(
  token: string,
  type: TokenType = "access"
): Promise<{ userId: string; workspaceId: string; type: TokenType }> {
  const secret = type === "refresh" ? JWT_REFRESH_SECRET : JWT_SECRET;
  
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    return {
      userId: payload.userId as string,
      workspaceId: payload.workspaceId as string,
      type: payload.type as TokenType,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new Error("Invalid token");
  }
}

/**
 * Get user from database by ID
 */
export async function getUserById(userId: string): Promise<AuthUser | null> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      workspaceId: users.workspaceId,
      role: users.role,
      avatar: users.avatar,
      emailVerified: users.emailVerified,
      twoFactorEnabled: users.twoFactorEnabled,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      workspaceId: users.workspaceId,
      role: users.role,
      avatar: users.avatar,
      emailVerified: users.emailVerified,
      twoFactorEnabled: users.twoFactorEnabled,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return user || null;
}

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<Session> {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const accessToken = await createToken(userId, user.workspaceId, "access");
  const refreshToken = await createToken(userId, user.workspaceId, "refresh", REFRESH_TOKEN_EXPIRY);

  // Store session in database
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY);
  
  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      token: accessToken,
      refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    })
    .returning();

  return {
    id: session.id,
    userId: user.id,
    workspaceId: user.workspaceId,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
  };
}

/**
 * Validate session token
 */
export async function validateSession(token: string): Promise<Session | null> {
  try {
    const payload = await verifyToken(token, "access");
    
    const [session] = await db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(and(
        eq(sessions.token, token),
        eq(sessions.userId, payload.userId)
      ))
      .limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return null;
    }

    const user = await getUserById(session.userId);
    if (!user) {
      return null;
    }

    return {
      id: session.id,
      userId: user.id,
      workspaceId: user.workspaceId,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };
  } catch {
    return null;
  }
}

/**
 * Refresh session token
 */
export async function refreshSession(refreshToken: string): Promise<Session | null> {
  try {
    const payload = await verifyToken(refreshToken, "refresh");
    
    // Find active session with this refresh token
    const [session] = await db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(and(
        eq(sessions.refreshToken, refreshToken),
        eq(sessions.userId, payload.userId)
      ))
      .limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return null;
    }

    // Create new tokens
    const user = await getUserById(session.userId);
    if (!user) {
      return null;
    }

    const newAccessToken = await createToken(user.id, user.workspaceId, "access");
    const newRefreshToken = await createToken(user.id, user.workspaceId, "refresh", REFRESH_TOKEN_EXPIRY);

    // Update session
    await db
      .update(sessions)
      .set({
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + SESSION_EXPIRY),
      })
      .where(eq(sessions.id, session.id));

    return {
      id: session.id,
      userId: user.id,
      workspaceId: user.workspaceId,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };
  } catch {
    return null;
  }
}

/**
 * Invalidate session
 */
export async function invalidateSession(userId: string): Promise<void> {
  await db
    .update(sessions)
    .set({
      expiresAt: new Date(0), // Set to epoch
    })
    .where(eq(sessions.userId, userId));
}

/**
 * Invalidate all sessions except current one
 */
export async function invalidateOtherSessions(userId: string, currentSessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({
      expiresAt: new Date(0),
    })
    .where(and(
      eq(sessions.userId, userId),
      ne(sessions.id, currentSessionId)
    ));
}

/**
 * Get workspace by ID
 */
export async function getWorkspaceById(workspaceId: string) {
  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      plan: workspaces.plan,
      timezone: workspaces.timezone,
      theme: workspaces.theme,
      language: workspaces.language,
      billingEnabled: workspaces.billingEnabled,
      stripeCustomerId: workspaces.stripeCustomerId,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  return workspace || null;
}

/**
 * Get workspace by slug
 */
export async function getWorkspaceBySlug(slug: string) {
  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      plan: workspaces.plan,
      timezone: workspaces.timezone,
      theme: workspaces.theme,
      language: workspaces.language,
      billingEnabled: workspaces.billingEnabled,
    })
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);

  return workspace || null;
}

/**
 * Check if user has permission
 */
export function hasPermission(user: AuthUser, requiredRole: "owner" | "admin" | "member"): boolean {
  const roles: Record<string, number> = {
    owner: 3,
    admin: 2,
    member: 1,
  };
  
  return roles[user.role] >= roles[requiredRole];
}

/**
 * Check workspace plan limits
 */
export async function checkWorkspaceLimits(
  workspaceId: string,
  feature: "agents" | "integrations" | "turns"
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const workspace = await getWorkspaceById(workspaceId);
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const plan = await getPlanByCode(workspace.plan);
  if (!plan) {
    throw new Error("Plan not found");
  }

  let current = 0;
  let limit = 0;

  switch (feature) {
    case "agents":
      const [count] = await db
        .select({ count: count() })
        .from(agents)
        .where(eq(agents.workspaceId, workspaceId));
      current = count?.count || 0;
      limit = plan.maxAgents;
      break;
    case "integrations":
      const [intCount] = await db
        .select({ count: count() })
        .from(integrations)
        .where(eq(integrations.workspaceId, workspaceId));
      current = intCount?.count || 0;
      limit = plan.maxIntegrations;
      break;
    case "turns":
      // Get current month usage
      const month = new Date().toISOString().slice(0, 7);
      const [turnCount] = await db
        .select({ count: count() })
        .from(usageEvents)
        .where(and(
          eq(usageEvents.workspaceId, workspaceId),
          eq(usageEvents.kind, "turn"),
          like(usageEvents.createdAt, `${month}%`)
        ));
      current = turnCount?.count || 0;
      limit = plan.monthlyTurns;
      break;
  }

  return {
    allowed: current < limit,
    current,
    limit,
  };
}

/**
 * Get plan by code
 */
export async function getPlanByCode(code: string) {
  const [plan] = await db
    .select({
      id: plans.id,
      code: plans.code,
      name: plans.name,
      maxAgents: plans.maxAgents,
      maxIntegrations: plans.maxIntegrations,
      monthlyTurns: plans.monthlyTurns,
      priceMonthly: plans.priceMonthly,
      features: plans.features,
    })
    .from(plans)
    .where(eq(plans.code, code))
    .limit(1);

  return plan || null;
}

// Import count function
import { count } from "drizzle-orm";
import { ne } from "drizzle-orm";
import { plans } from "../db/schema";

// Re-export auth utilities
export { createToken, verifyToken, getUserById, getUserByEmail };
