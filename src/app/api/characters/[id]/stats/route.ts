import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { formatBytes } from "@/lib/utils";

const charactersLogger = logger.withContext("CharactersAPI");

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    charactersLogger.info("🔄 Obteniendo estadísticas del personaje:", params.id);

    const character = await prisma.character.findUnique({
      where: {
        id: params.id,
      },
      include: {
        images: {
          select: {
            size: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            images: true
          }
        }
      }
    });

    if (!character) {
      charactersLogger.warn("❌ Personaje no encontrado:", params.id);
      return NextResponse.json(
        { error: "Personaje no encontrado" },
        { status: 404 }
      );
    }

    const totalSize = character.images.reduce((sum, img) => sum + img.size, 0);
    const lastUpdated = character.images.length > 0
      ? character.images.reduce((latest, img) =>
        img.createdAt > latest ? img.createdAt : latest
        , character.images[0].createdAt)
      : null;

    const stats = {
      count: character._count.images,
      size: formatBytes(totalSize),
      lastUpdated
    };

    charactersLogger.info("✅ Estadísticas obtenidas:", stats);

    return NextResponse.json(stats);
  } catch (error) {
    charactersLogger.error("❌ Error al obtener estadísticas:", error);
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
    charactersLogger.info("🔄 Actualizando estadísticas del personaje:", params.id);

    const character = await prisma.character.findUnique({
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

    if (!character) {
      charactersLogger.warn("❌ Personaje no encontrado:", params.id);
      return NextResponse.json(
        { error: "Personaje no encontrado" },
        { status: 404 }
      );
    }

    const totalSize = character.images.reduce((acc, img) => acc + img.size, 0);
    const stats = {
      count: character.images.length,
      size: formatBytes(totalSize),
      lastUpdated: new Date(),
    };

    charactersLogger.info("✅ Estadísticas actualizadas:", stats);

    return NextResponse.json(stats);
  } catch (error) {
    charactersLogger.error("❌ Error al actualizar estadísticas:", error);
    return NextResponse.json(
      { error: "Error al actualizar estadísticas" },
      { status: 500 }
    );
  }
}