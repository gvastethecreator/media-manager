import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatBytes } from "@/lib/format";
import { logger } from "@/lib/logger";

const placeLogger = logger.withContext("PlaceAPI");

export async function GET() {
  try {
    const places = await prisma.place.findMany({
      include: {
        images: {
          select: {
            id: true,
            path: true,
            size: true,
            tags: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 9,
        },
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    const processedPlaces = await Promise.all(places.map(async (place: any) => {
      const totalSize = place.images.reduce((sum: any, img: any) => sum + img.size, 0);

      const tagCounts = place.images.reduce((acc: any, img: any) => {
        img.tags.forEach((tag: any) => {
          acc[tag.name] = (acc[tag.name] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      const topTags = Object.entries(tagCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      const recentImages = place.images.map((img: any) => `/api/thumbnails/${img.id}`);

      return {
        id: place.id,
        name: place.name,
        emoji: place.emoji || "📍",
        color: place.color || "#3b82f6",
        description: place.description || "",
        shortcut: place.shortcut,
        count: place._count.images,
        size: formatBytes(totalSize),
        recentImages,
        topTags,
      };
    }));

    return NextResponse.json(processedPlaces);
  } catch (error) {
    placeLogger.error("Error al obtener lugares:", error);
    return NextResponse.json({ error: "Error al obtener lugares" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const place = await prisma.place.create({
      data: {
        name: data.name,
        emoji: data.emoji,
        color: data.color,
        description: data.description,
        shortcut: data.shortcut,
        sortBy: data.sortBy || "name",
        filters: data.filters || "[]",
      },
    });

    placeLogger.info("Lugar creado:", place);
    return NextResponse.json(place);
  } catch (error) {
    placeLogger.error("Error al crear lugar:", error);
    return NextResponse.json({ error: "Error al crear lugar" }, { status: 500 });
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