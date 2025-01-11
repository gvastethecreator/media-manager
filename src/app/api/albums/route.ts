import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { formatBytes } from "@/lib/utils";

const albumsLogger = logger.withContext("AlbumsAPI");

export async function GET() {
  try {
    albumsLogger.info("🔄 Obteniendo álbumes...");

    const albums = await prisma.album.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        images: {
          select: {
            size: true,
          },
        },
      },
    });

    const albumsWithStats = albums.map((album) => {
      const totalSize = album.images.reduce((acc, img) => acc + img.size, 0);
      return {
        ...album,
        count: album.images.length,
        size: formatBytes(totalSize),
        images: undefined,
      };
    });

    albumsLogger.info(`✅ ${albums.length} álbumes obtenidos`);

    return NextResponse.json(albumsWithStats);
  } catch (error) {
    albumsLogger.error("❌ Error al obtener álbumes:", error);
    return NextResponse.json(
      { error: "Error al obtener álbumes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    albumsLogger.info("➕ Creando nuevo álbum:", data);

    const album = await prisma.album.create({
      data: {
        name: data.name,
        emoji: data.emoji || "📸",
        description: data.description,
        color: data.color || "#3b82f6",
        shortcut: data.shortcut,
        sortBy: data.sortBy || "name",
        filters: data.filters ? JSON.stringify(data.filters) : "[]",
      },
    });

    albumsLogger.info("✅ Álbum creado:", album.id);

    return NextResponse.json(album);
  } catch (error) {
    albumsLogger.error("❌ Error al crear álbum:", error);
    return NextResponse.json(
      { error: "Error al crear álbum" },
      { status: 500 }
    );
  }
}