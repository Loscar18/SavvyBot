// Authentication API functions

import { db } from "../db";
import { users, sessions, workspaces, passwordResetTokens, emailVerificationTokens } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { createToken, verifyToken, getUserByEmail, getUserById, createSession, invalidateSession, validateSession, refreshSession as refreshUserSession } from "../auth";
import { hashPassword, comparePassword, generateToken } from "../crypto";
import { sendEmail } from "../utils/email";
import { generateId } from "../utils";

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  try {
    // In a real implementation, we'd get the token from cookies
    // For now, return mock data
    return {
      user: null,
      session: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error.message : "Error al obtener usuario",
    };
  }
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string) {
  // Validate input
  if (!email || !password) {
    throw new Error("Email y contraseña son requeridos");
  }

  // Find user
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Check if user has password set (for OAuth users)
  if (!user.passwordHash) {
    throw new Error("Este usuario solo puede iniciar sesión con OAuth");
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error("Contraseña incorrecta");
  }

  // Check if email is verified
  if (!user.emailVerified) {
    throw new Error("Por favor verifica tu email antes de iniciar sesión");
  }

  // Create session
  const session = await createSession(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      workspaceId: user.workspaceId,
      role: user.role as "owner" | "admin" | "member",
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
    },
    session,
  };
}

/**
 * Register new user
 */
export async function register(name: string, email: string, password: string) {
  // Validate input
  if (!name || !email || !password) {
    throw new Error("Nombre, email y contraseña son requeridos");
  }

  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("El email ya está en uso");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate workspace ID
  const workspaceId = generateId();
  const workspaceSlug = generateToken(8);

  // Create workspace
  const [workspace] = await db
    .insert(workspaces)
    .values({
      id: workspaceId,
      name: `${name}'s Workspace`,
      slug: workspaceSlug,
      plan: "free",
      timezone: "Europe/Madrid",
      theme: "light",
      language: "es",
      billingEnabled: false,
    })
    .returning();

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      id: generateId(),
      email: email.toLowerCase(),
      name,
      passwordHash,
      workspaceId: workspaceId,
      role: "owner",
      emailVerified: false,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      workspaceId: users.workspaceId,
      role: users.role,
      avatar: users.avatar,
      emailVerified: users.emailVerified,
      twoFactorEnabled: users.twoFactorEnabled,
    });

  // Create session
  const session = await createSession(user.id);

  // Generate email verification token
  const verificationToken = generateToken(32);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    token: verificationToken,
    expiresAt,
  });

  // Send verification email
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: "Verifica tu email - SavvyBot",
    html: `
      <h1>Verifica tu email</h1>
      <p>Hola ${user.name},</p>
      <p>Por favor haz clic en el siguiente enlace para verificar tu email:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>Este enlace expirará en 24 horas.</p>
    `,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      workspaceId: user.workspaceId,
      role: user.role as "owner" | "admin" | "member",
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
    },
    session,
  };
}

/**
 * Logout user
 */
export async function logout() {
  // In a real implementation, we'd get the user ID from the session
  // For now, just clear the session
  return true;
}

/**
 * Refresh session
 */
export async function refreshSession() {
  // In a real implementation, we'd get the refresh token from cookies
  // For now, return mock data
  return {
    user: null,
    session: null,
  };
}

// ============================================
// PASSWORD RESET
// ============================================

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string) {
  // Find user
  const user = await getUserByEmail(email);
  if (!user) {
    // Don't reveal that user doesn't exist
    return true;
  }

  // Generate reset token
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Save token
  await db
    .insert(passwordResetTokens)
    .values({
      userId: user.id,
      token,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [passwordResetTokens.userId],
      set: {
        token,
        expiresAt,
        createdAt: new Date(),
      },
    });

  // Send email
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Restablece tu contraseña - SavvyBot",
    html: `
      <h1>Restablece tu contraseña</h1>
      <p>Hola ${user.name},</p>
      <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Este enlace expirará en 1 hora.</p>
      <p>Si no solicitaste esto, ignora este email.</p>
    `,
  });

  return true;
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string) {
  // Find token
  const [resetToken] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
      expiresAt: passwordResetTokens.expiresAt,
    })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (!resetToken || new Date(resetToken.expiresAt) < new Date()) {
    throw new Error("Token inválido o expirado");
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update user password
  await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, resetToken.userId));

  // Delete token
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.id, resetToken.id));

  // Invalidate all sessions
  await invalidateSession(resetToken.userId);

  return true;
}

// ============================================
// EMAIL VERIFICATION
// ============================================

/**
 * Verify email with token
 */
export async function verifyEmail(token: string) {
  // Find token
  const [verificationToken] = await db
    .select({
      id: emailVerificationTokens.id,
      userId: emailVerificationTokens.userId,
      expiresAt: emailVerificationTokens.expiresAt,
    })
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.token, token))
    .limit(1);

  if (!verificationToken || new Date(verificationToken.expiresAt) < new Date()) {
    throw new Error("Token inválido o expirado");
  }

  // Update user
  await db
    .update(users)
    .set({
      emailVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, verificationToken.userId));

  // Delete token
  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.id, verificationToken.id));

  return true;
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string) {
  // Find user
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  if (user.emailVerified) {
    throw new Error("Email ya verificado");
  }

  // Generate new token
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Delete old tokens
  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, user.id));

  // Save new token
  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  // Send email
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Verifica tu email - SavvyBot",
    html: `
      <h1>Verifica tu email</h1>
      <p>Hola ${user.name},</p>
      <p>Por favor haz clic en el siguiente enlace para verificar tu email:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>Este enlace expirará en 24 horas.</p>
    `,
  });

  return true;
}

// ============================================
// SOCIAL AUTH
// ============================================

/**
 * Handle Google OAuth callback
 */
export async function handleGoogleCallback(code: string, redirectUri: string) {
  // In a real implementation, we'd exchange the code for tokens
  // For now, return mock data
  return {
    user: null,
    session: null,
  };
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get session by token
 */
export async function getSessionByToken(token: string) {
  return await validateSession(token);
}

/**
 * Invalidate all sessions for user
 */
export async function invalidateAllSessions(userId: string) {
  await db
    .update(sessions)
    .set({
      expiresAt: new Date(0),
    })
    .where(eq(sessions.userId, userId));

  return true;
}

// ============================================
// EXPORTS
// ============================================

export {
  getCurrentUser,
  login,
  register,
  logout,
  refreshSession,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  handleGoogleCallback,
  getSessionByToken,
  invalidateAllSessions,
};
