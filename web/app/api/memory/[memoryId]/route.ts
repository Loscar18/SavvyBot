import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateMemory, deleteMemory } from "../../../../lib/agents";
import { authenticate } from "../../../../lib/api/auth";

const UpdateMemorySchema = z.object({
  text: z.string().min(1),
});

// PUT /api/memory/[memoryId] - Update memory
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const { memoryId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateMemorySchema.parse(body);

    const memory = await updateMemory(memoryId, auth.workspaceId, validated.text);

    if (!memory) {
      return NextResponse.json({ error: "Memoria no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: memory,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Error al actualizar memoria" },
      { status: 500 }
    );
  }
}

// DELETE /api/memory/[memoryId] - Delete memory
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const { memoryId } = await params;
    const auth = await authenticate(request);
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const deleted = await deleteMemory(memoryId, auth.workspaceId);

    if (!deleted) {
      return NextResponse.json({ error: "Memoria no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Memoria eliminada correctamente",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar memoria" },
      { status: 500 }
    );
  }
}
