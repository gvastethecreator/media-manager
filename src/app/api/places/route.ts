import { NextResponse } from "next/server";
import { placeService } from "@/services/place.service";
import { logger } from "@/lib/logger";

const placeLogger = logger.withContext("PlacesAPI");

export async function GET() {
  try {
    placeLogger.info("📥 GET /api/places");
    const places = await placeService.getPlaces();
    return NextResponse.json(places);
  } catch (error) {
    placeLogger.error("❌ Error en GET /api/places:", error);
    return NextResponse.json(
      { error: "Error al obtener lugares" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    placeLogger.info("📤 POST /api/places", data);
    const place = await placeService.createPlace(data);
    return NextResponse.json(place);
  } catch (error) {
    placeLogger.error("❌ Error en POST /api/places:", error);
    return NextResponse.json(
      { error: "Error al crear lugar" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = request.url.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "ID de lugar no proporcionado" },
        { status: 400 }
      );
    }

    placeLogger.info("📝 Actualizando lugar:", { id, body });

    const place = await prisma.place.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
      },
      include: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    const formattedPlace = {
      ...place,
      count: place._count.images,
      _count: undefined,
    };

    placeLogger.info("✅ Lugar actualizado:", formattedPlace);

    return NextResponse.json(formattedPlace);
  } catch (error) {
    placeLogger.error("❌ Error al actualizar lugar:", error);
    return NextResponse.json(
      { error: "Error al actualizar lugar" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const id = request.url.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "ID de lugar no proporcionado" },
        { status: 400 }
      );
    }

    placeLogger.info("🗑️ Eliminando lugar:", id);

    await prisma.place.delete({
      where: { id },
    });

    placeLogger.info("✅ Lugar eliminado:", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    placeLogger.error("❌ Error al eliminar lugar:", error);
    return NextResponse.json(
      { error: "Error al eliminar lugar" },
      { status: 500 }
    );
  }
}