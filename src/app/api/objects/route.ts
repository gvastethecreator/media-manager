import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatBytes } from "@/lib/format";
import { logger } from "@/lib/logger";

const objectLogger = logger.withContext("ObjectAPI");

export async function GET() {
  try {
    const objects = await prisma.object.findMany({
      include: {
        images: {
          select: {
            id: true,
            path: true,
            size: true,
            tags: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 9
        },
        _count: {
          select: {
            images: true
          }
        }
      }
    });

    const processedObjects = await Promise.all(objects.map(async (object: any) => {
      const totalSize = object.images.reduce((sum: any, img: any) => sum + img.size, 0);

      const tagCounts = object.images.reduce((acc: any, img: any) => {
        img.tags.forEach((tag: any) => {
          acc[tag.name] = (acc[tag.name] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      const topTags = Object.entries(tagCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      const recentImages = object.images.map((img: any) => `/api/thumbnails/${img.id}`);

      return {
        id: object.id,
        name: object.name,
        emoji: object.emoji || '🎯',
        color: object.color || '#3b82f6',
        description: object.description || '',
        shortcut: object.shortcut,
        count: object._count.images,
        size: formatBytes(totalSize),
        recentImages,
        topTags
      };
    }));

    return NextResponse.json(processedObjects);
  } catch (error) {
    objectLogger.error("Error al obtener objetos:", error);
    return NextResponse.json({ error: "Error al obtener objetos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const object = await prisma.object.create({
      data: {
        name: data.name,
        emoji: data.emoji,
        color: data.color,
        description: data.description,
        shortcut: data.shortcut,
        sortBy: data.sortBy || 'name',
        filters: data.filters || '[]'
      }
    });

    objectLogger.info("Objeto creado:", object);
    return NextResponse.json(object);
  } catch (error) {
    objectLogger.error("Error al crear objeto:", error);
    return NextResponse.json({ error: "Error al crear objeto" }, { status: 500 });
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