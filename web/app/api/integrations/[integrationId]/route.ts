import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getIntegrationById, updateIntegration, deleteIntegration, listIntegrationTools, connectComposio, listComposioApps, listComposioTools, connectMCPServer, listMCPTools } from "../../../../lib/integrations";
import { authenticate } from "../../../../lib/api/auth";

const UpdateIntegrationSchema = z.object({
  displayName: z.string().optional(),
  description: z.string().optional(),
  config: z.record(z.any()).optional(),
  status: z.enum(["pending", "connected", "error", "disconnected"]).optional(),
  errorMessage: z.string().optional(),
  connectedAccountId: z.string().optional(),
  mcpType: z.enum(["http", "sse", "stdio"]).optional(),
  mcpUrl: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/integrations/[integrationId] - Get integration details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const { integrationId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const integration = await getIntegrationById(integrationId, auth.workspaceId);
    if (!integration) {
      return NextResponse.json({ error: "Integración no encontrada" }, { status: 404 });
    }

    // Get tools for this integration
    let tools: any[] = [];
    try {
      tools = await listIntegrationTools(integrationId);
    } catch (e) {
      console.log(`Error listing tools for integration ${integrationId}:`, e);
    }

    return NextResponse.json({
      success: true,
      data: {
        integration,
        tools,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener integración" },
      { status: 500 }
    );
  }
}

// PUT /api/integrations/[integrationId] - Update integration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const { integrationId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateIntegrationSchema.parse(body);

    const integration = await updateIntegration(
      integrationId,
      auth.workspaceId,
      validated
    );

    if (!integration) {
      return NextResponse.json({ error: "Integración no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: integration,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error al actualizar integración" },
      { status: 500 }
    );
  }
}

// DELETE /api/integrations/[integrationId] - Delete integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const { integrationId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const deleted = await deleteIntegration(integrationId, auth.workspaceId);
    if (!deleted) {
      return NextResponse.json({ error: "Integración no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Integración eliminada correctamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar integración" },
      { status: 500 }
    );
  }
}

// POST /api/integrations/[integrationId]/connect - Connect integration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const { integrationId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const integration = await getIntegrationById(integrationId, auth.workspaceId);
    if (!integration) {
      return NextResponse.json({ error: "Integración no encontrada" }, { status: 404 });
    }

    let result;
    
    switch (integration.kind) {
      case "composio":
        result = await connectComposio(integrationId);
        break;
      case "mcp":
        const body = await request.json();
        result = await connectMCPServer(integrationId, body);
        break;
      case "api":
        result = { success: true, message: "API conectada" };
        break;
      default:
        return NextResponse.json(
          { error: "Tipo de integración no soportado" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al conectar integración" },
      { status: 500 }
    );
  }
}

// GET /api/integrations/[integrationId]/tools - List tools for integration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ integrationId: string }> }
) {
  try {
    const { integrationId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tools = await listIntegrationTools(integrationId);

    return NextResponse.json({
      success: true,
      data: tools,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener herramientas" },
      { status: 500 }
    );
  }
}

// GET /api/integrations/composio/apps - List available Composio apps
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const apps = await listComposioApps();

    return NextResponse.json({
      success: true,
      data: apps,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener apps de Composio" },
      { status: 500 }
    );
  }
}
