import { NextResponse } from "next/server";
import { placeService } from "@/services/place.service";
import { logger } from "@/lib/logger";

const placeLogger = logger.withContext("PlacesAPI");

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    placeLogger.info(`📥 GET /api/places/${params.id}`);
    const place = await placeService.getPlace(params.id);
    if (!place) {
      return NextResponse.json(
        { error: "Lugar no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(place);
  } catch (error) {
    placeLogger.error(`❌ Error en GET /api/places/${params.id}:`, error);
    return NextResponse.json(
      { error: "Error al obtener lugar" },
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
    placeLogger.info(`📤 PUT /api/places/${params.id}`, data);
    const place = await placeService.updatePlace(params.id, data);
    if (!place) {
      return NextResponse.json(
        { error: "Lugar no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(place);
  } catch (error) {
    placeLogger.error(`❌ Error en PUT /api/places/${params.id}:`, error);
    return NextResponse.json(
      { error: "Error al actualizar lugar" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    placeLogger.info(`🗑️ DELETE /api/places/${params.id}`);
    const place = await placeService.deletePlace(params.id);
    if (!place) {
      return NextResponse.json(
        { error: "Lugar no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    placeLogger.error(`❌ Error en DELETE /api/places/${params.id}:`, error);
    return NextResponse.json(
      { error: "Error al eliminar lugar" },
      { status: 500 }
    );
  }
}