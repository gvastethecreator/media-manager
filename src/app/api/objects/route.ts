import { NextResponse } from "next/server";
import { objectService } from "@/services/object.service";
import { logger } from "@/lib/logger";

const objectLogger = logger.withContext("ObjectsAPI");

export async function GET() {
  try {
    objectLogger.info("📥 GET /api/objects");
    const objects = await objectService.getObjects();
    return NextResponse.json(objects);
  } catch (error) {
    objectLogger.error("❌ Error en GET /api/objects:", error);
    return NextResponse.json(
      { error: "Error al obtener objetos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    objectLogger.info("📤 POST /api/objects", data);
    const object = await objectService.createObject(data);
    return NextResponse.json(object);
  } catch (error) {
    objectLogger.error("❌ Error en POST /api/objects:", error);
    return NextResponse.json(
      { error: "Error al crear objeto" },
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
        { error: "ID de objeto no proporcionado" },
        { status: 400 }
      );
    }

    objectLogger.info("📝 Actualizando objeto:", { id, body });

    const object = await prisma.object.update({
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

    const formattedObject = {
      ...object,
      count: object._count.images,
      _count: undefined,
    };

    objectLogger.info("✅ Objeto actualizado:", formattedObject);

    return NextResponse.json(formattedObject);
  } catch (error) {
    objectLogger.error("❌ Error al actualizar objeto:", error);
    return NextResponse.json(
      { error: "Error al actualizar objeto" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const id = request.url.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "ID de objeto no proporcionado" },
        { status: 400 }
      );
    }

    objectLogger.info("🗑️ Eliminando objeto:", id);

    await prisma.object.delete({
      where: { id },
    });

    objectLogger.info("✅ Objeto eliminado:", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    objectLogger.error("❌ Error al eliminar objeto:", error);
    return NextResponse.json(
      { error: "Error al eliminar objeto" },
      { status: 500 }
    );
  }
}