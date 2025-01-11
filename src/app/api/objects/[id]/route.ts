import { NextResponse } from "next/server";
import { objectService } from "@/services/object.service";
import { logger } from "@/lib/logger";

const objectLogger = logger.withContext("ObjectsAPI");

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    objectLogger.info("📥 GET /api/objects/[id]", params.id);
    const object = await objectService.getObject(params.id);
    if (!object) {
      return NextResponse.json(
        { error: "Objeto no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(object);
  } catch (error) {
    objectLogger.error("❌ Error en GET /api/objects/[id]:", error);
    return NextResponse.json(
      { error: "Error al obtener objeto" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    objectLogger.info("📤 PUT /api/objects/[id]", { id: params.id, data });
    const object = await objectService.updateObject(params.id, data);
    return NextResponse.json(object);
  } catch (error) {
    objectLogger.error("❌ Error en PUT /api/objects/[id]:", error);
    return NextResponse.json(
      { error: "Error al actualizar objeto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    objectLogger.info("🗑️ DELETE /api/objects/[id]", params.id);
    await objectService.deleteObject(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    objectLogger.error("❌ Error en DELETE /api/objects/[id]:", error);
    return NextResponse.json(
      { error: "Error al eliminar objeto" },
      { status: 500 }
    );
  }
}