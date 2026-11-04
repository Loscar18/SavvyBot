import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import { workspaces, users } from "../../../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../../../lib/api/auth";
import { encrypt, decrypt } from "../../../lib/crypto";

const UpdateWorkspaceSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  billingEnabled: z.boolean().optional(),
  stripeCustomerId: z.string().optional(),
  stripeApiKey: z.string().optional(),
  composioApiKey: z.string().optional(),
  defaultModel: z.string().optional(),
  defaultModelKey: z.string().optional(),
});

// GET /api/settings - Get workspace settings
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
        stripeApiKeyCiphertext: workspaces.stripeApiKeyCiphertext,
        composioApiKeyCiphertext: workspaces.composioApiKeyCiphertext,
        defaultModel: workspaces.defaultModel,
        defaultModelKeyCiphertext: workspaces.defaultModelKeyCiphertext,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      })
      .from(workspaces)
      .where(eq(workspaces.id, auth.workspaceId))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace no encontrado" }, { status: 404 });
    }

    // Decrypt sensitive data
    const encryptionKey = process.env.ENCRYPTION_KEY!;
    let stripeApiKey: string | null = null;
    let composioApiKey: string | null = null;
    let defaultModelKey: string | null = null;

    if (workspace.stripeApiKeyCiphertext) {
      stripeApiKey = decrypt(workspace.stripeApiKeyCiphertext, encryptionKey);
    }
    if (workspace.composioApiKeyCiphertext) {
      composioApiKey = decrypt(workspace.composioApiKeyCiphertext, encryptionKey);
    }
    if (workspace.defaultModelKeyCiphertext) {
      defaultModelKey = decrypt(workspace.defaultModelKeyCiphertext, encryptionKey);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...workspace,
        stripeApiKey: stripeApiKey || undefined,
        composioApiKey: composioApiKey || undefined,
        defaultModelKey: defaultModelKey || undefined,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener configuración" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update workspace settings
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateWorkspaceSettingsSchema.parse(body);

    const encryptionKey = process.env.ENCRYPTION_KEY!;

    // Encrypt sensitive data
    let stripeApiKeyCiphertext = undefined;
    let composioApiKeyCiphertext = undefined;
    let defaultModelKeyCiphertext = undefined;

    if (validated.stripeApiKey) {
      stripeApiKeyCiphertext = encrypt(validated.stripeApiKey, encryptionKey);
    }
    if (validated.composioApiKey) {
      composioApiKeyCiphertext = encrypt(validated.composioApiKey, encryptionKey);
    }
    if (validated.defaultModelKey) {
      defaultModelKeyCiphertext = encrypt(validated.defaultModelKey, encryptionKey);
    }

    const [workspace] = await db
      .update(workspaces)
      .set({
        name: validated.name,
        timezone: validated.timezone,
        language: validated.language,
        theme: validated.theme,
        billingEnabled: validated.billingEnabled,
        stripeCustomerId: validated.stripeCustomerId,
        stripeApiKeyCiphertext,
        composioApiKeyCiphertext,
        defaultModel: validated.defaultModel,
        defaultModelKeyCiphertext,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, auth.workspaceId))
      .returning();

    return NextResponse.json({
      success: true,
      data: workspace,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error al actualizar configuración" },
      { status: 500 }
    );
  }
}

// POST /api/settings/export - Export workspace configuration
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get workspace data (without sensitive info)
    const [workspace] = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        plan: workspaces.plan,
        timezone: workspaces.timezone,
        language: workspaces.language,
        theme: workspaces.theme,
        billingEnabled: workspaces.billingEnabled,
        defaultModel: workspaces.defaultModel,
        createdAt: workspaces.createdAt,
      })
      .from(workspaces)
      .where(eq(workspaces.id, auth.workspaceId))
      .limit(1);

    if (!workspace) {
      return NextResponse.json({ error: "Workspace no encontrado" }, { status: 404 });
    }

    // Get agents (without keys)
    const agents = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        emoji: workspaces.name,
        color: workspaces.name,
        role: workspaces.name,
        autonomy: workspaces.plan,
        modelName: workspaces.name,
      })
      .from(workspaces)
      .where(eq(workspaces.id, auth.workspaceId))
      .limit(1);

    // Create export
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      workspace: {
        ...workspace,
        stripeCustomerId: undefined,
        stripeApiKeyCiphertext: undefined,
        composioApiKeyCiphertext: undefined,
        defaultModelKeyCiphertext: undefined,
      },
      agents: [],
      groups: [],
      routines: [],
      memories: [],
      skills: [],
    };

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al exportar configuración" },
      { status: 500 }
    );
  }
}
