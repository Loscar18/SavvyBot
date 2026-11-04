import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getIntegrationsByWorkspace, createIntegration, updateIntegration, deleteIntegration } from "../../../lib/integrations";
import { authenticate } from "../../../lib/api/auth";

const CreateIntegrationSchema = z.object({
  kind: z.enum(["composio", "mcp", "api"]),
  providerName: z.string().min(1),
  displayName: z.string().optional(),
  description: z.string().optional(),
  config: z.record(z.any()).optional(),
  mcpType: z.enum(["http", "sse", "stdio"]).optional(),
  mcpUrl: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/integrations - List all integrations for workspace
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const integrations = await getIntegrationsByWorkspace(auth.workspaceId);

    return NextResponse.json({
      success: true,
      data: integrations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener integraciones" },
      { status: 500 }
    );
  }
}

// POST /api/integrations - Create a new integration
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = CreateIntegrationSchema.parse(body);

    const integration = await createIntegration(auth.workspaceId, validated);

    return NextResponse.json({
      success: true,
      data: integration,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error al crear integración" },
      { status: 500 }
    );
  }
}
