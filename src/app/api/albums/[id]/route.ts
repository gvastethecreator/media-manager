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
    albumsLogger.info("🔄 Obteniendo álbum:", params.id);

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
    const albumWithStats = {
      ...album,
      count: album.images.length,
      size: formatBytes(totalSize),
      images: undefined,
    };

    albumsLogger.info("✅ Álbum obtenido:", params.id);

    return NextResponse.json(albumWithStats);
  } catch (error) {
    albumsLogger.error("❌ Error al obtener álbum:", error);
    return NextResponse.json(
      { error: "Error al obtener álbum" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    albumsLogger.info("💾 Actualizando álbum:", { id: params.id, data });

    const album = await prisma.album.update({
      where: {
        id: params.id,
      },
      data: {
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        color: data.color,
        shortcut: data.shortcut,
        sortBy: data.sortBy,
        filters: data.filters ? JSON.stringify(data.filters) : undefined,
      },
    });

    albumsLogger.info("✅ Álbum actualizado:", params.id);

    return NextResponse.json(album);
  } catch (error) {
    albumsLogger.error("❌ Error al actualizar álbum:", error);
    return NextResponse.json(
      { error: "Error al actualizar álbum" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    albumsLogger.info("🗑️ Eliminando álbum:", params.id);

    await prisma.album.delete({
      where: {
        id: params.id,
      },
    });

    albumsLogger.info("✅ Álbum eliminado:", params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    albumsLogger.error("❌ Error al eliminar álbum:", error);
    return NextResponse.json(
      { error: "Error al eliminar álbum" },
      { status: 500 }
    );
  }
}