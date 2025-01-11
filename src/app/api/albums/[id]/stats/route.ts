import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { formatBytes } from "@/lib/utils";

const albumsLogger = logger.withContext("AlbumsAPI");

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    albumsLogger.info("🔄 Obteniendo estadísticas del álbum:", params.id);

    const album = await prisma.album.findUnique({
      where: {
        id: params.id,
      },
      include: {
        images: {
          select: {
            size: true,
          },
        },
      },
    });

    if (!album) {
      albumsLogger.warn("❌ Álbum no encontrado:", params.id);
      return NextResponse.json(
        { error: "Álbum no encontrado" },
        { status: 404 }
      );
    }

    const totalSize = album.images.reduce((acc, img) => acc + img.size, 0);
    const stats = {
      count: album.images.length,
      size: formatBytes(totalSize),
    };

    albumsLogger.info("✅ Estadísticas obtenidas:", { id: params.id, stats });

    return NextResponse.json(stats);
  } catch (error) {
    albumsLogger.error("❌ Error al obtener estadísticas:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    albumsLogger.info("🔄 Actualizando estadísticas del álbum:", params.id);

    const album = await prisma.album.findUnique({
      where: {
        id: params.id,
      },
      include: {
        images: {
          select: {
            size: true,
          },
        },
      },
    });

    if (!album) {
      albumsLogger.warn("❌ Álbum no encontrado:", params.id);
      return NextResponse.json(
        { error: "Álbum no encontrado" },
        { status: 404 }
      );
    }

    const totalSize = album.images.reduce((acc, img) => acc + img.size, 0);
    const stats = {
      count: album.images.length,
      size: formatBytes(totalSize),
    };

    albumsLogger.info("✅ Estadísticas actualizadas:", {
      id: params.id,
      stats,
    });

    return NextResponse.json(stats);
  } catch (error) {
    albumsLogger.error("❌ Error al actualizar estadísticas:", error);
    return NextResponse.json(
      { error: "Error al actualizar estadísticas" },
      { status: 500 }
    );
  }
}