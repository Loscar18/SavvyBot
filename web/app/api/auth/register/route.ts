import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../../lib/db";
import { users, workspaces } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../../../lib/auth";
import { v4 as uuidv4 } from "uuid";

const RegisterSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().min(1, "El nombre es obligatorio"),
  workspaceName: z.string().min(1, "El nombre del workspace es obligatorio"),
});

// POST /api/auth/register - Register new user and workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RegisterSchema.parse(body);

    // Check if email already exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email ya está registrado" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password);

    // Create workspace
    const workspaceId = uuidv4();
    const [workspace] = await db
      .insert(workspaces)
      .values({
        id: workspaceId,
        name: validated.workspaceName,
        plan: "free",
        timezone: "Europe/Madrid",
        language: "es",
        theme: "light",
        billingEnabled: false,
      })
      .returning();

    // Create user
    const userId = uuidv4();
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        email: validated.email,
        passwordHash,
        name: validated.name,
        workspaceId,
        role: "owner",
        emailVerified: false,
        image: null,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        workspaceId: users.workspaceId,
        role: users.role,
        createdAt: users.createdAt,
      });

    // TODO: Send verification email

    return NextResponse.json({
      success: true,
      data: {
        user,
        workspace,
      },
      message: "Registro exitoso. Por favor, verifica tu email.",
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error al registrar usuario" },
      { status: 500 }
    );
  }
}
