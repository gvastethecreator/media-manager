import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { formatBytes } from "@/lib/utils";

const charactersLogger = logger.withContext("CharactersAPI");

export async function GET() {
  try {
    charactersLogger.info("🔄 Obteniendo personajes...");

    const characters = await prisma.character.findMany({
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

    const processedCharacters = await Promise.all(characters.map(async (character: any) => {
      const totalSize = character.images.reduce((sum: any, img: any) => sum + img.size, 0);

      const tagCounts = character.images.reduce((acc: any, img: any) => {
        img.tags.forEach((tag: any) => {
          acc[tag.name] = (acc[tag.name] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);

      const topTags = Object.entries(tagCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      const recentImages = character.images.map((img: any) => `/api/thumbnails/${img.id}`);

      return {
        id: character.id,
        name: character.name,
        emoji: character.emoji || '👤',
        color: character.color || '#3b82f6',
        description: character.description || '',
        shortcut: character.shortcut,
        count: character._count.images,
        size: formatBytes(totalSize),
        recentImages,
        topTags
      };
    }));

    charactersLogger.info(`✅ ${characters.length} personajes obtenidos`);

    return NextResponse.json(processedCharacters);
  } catch (error) {
    charactersLogger.error("❌ Error al obtener personajes:", error);
    return NextResponse.json(
      { error: "Error al obtener personajes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    charactersLogger.info("➕ Creando nuevo personaje:", data);

    const character = await prisma.character.create({
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

    charactersLogger.info("✅ Personaje creado:", character);

    return NextResponse.json(character);
  } catch (error) {
    charactersLogger.error("❌ Error al crear personaje:", error);
    return NextResponse.json(
      { error: "Error al crear personaje" },
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
        { error: "ID de personaje no proporcionado" },
        { status: 400 }
      );
    }

    charactersLogger.info("📝 Actualizando personaje:", { id, body });

    const character = await prisma.character.update({
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

    const formattedCharacter = {
      ...character,
      count: character._count.images,
      _count: undefined,
    };

    charactersLogger.info("✅ Personaje actualizado:", formattedCharacter);

    return NextResponse.json(formattedCharacter);
  } catch (error) {
    charactersLogger.error("❌ Error al actualizar personaje:", error);
    return NextResponse.json(
      { error: "Error al actualizar personaje" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const id = request.url.split("/").pop();

    if (!id) {
      return NextResponse.json(
        { error: "ID de personaje no proporcionado" },
        { status: 400 }
      );
    }

    charactersLogger.info("🗑️ Eliminando personaje:", id);

    await prisma.character.delete({
      where: { id },
    });

    charactersLogger.info("✅ Personaje eliminado:", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    charactersLogger.error("❌ Error al eliminar personaje:", error);
    return NextResponse.json(
      { error: "Error al eliminar personaje" },
      { status: 500 }
    );
  }
}