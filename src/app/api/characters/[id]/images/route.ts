import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const characterLogger = logger.withContext("CharacterAPI");

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const character = await prisma.character.findUnique({
      where: { id: params.id },
      include: {
        images: {
          select: {
            id: true,
            name: true,
            path: true,
            size: true,
            width: true,
            height: true,
            isFavorite: true,
            createdAt: true,
            updatedAt: true,
            tags: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            collections: {
              select: {
                id: true,
                name: true,
                emoji: true,
                color: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!character) {
      return NextResponse.json({ error: 'Personaje no encontrado' }, { status: 404 });
    }

    return NextResponse.json(character.images);
  } catch (error) {
    characterLogger.error('Error al obtener imágenes del personaje:', error);
    return NextResponse.json({ error: 'Error al obtener imágenes del personaje' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { imageId } = data;

    const character = await prisma.character.update({
      where: { id: params.id },
      data: {
        images: {
          connect: { id: imageId }
        }
      },
      include: {
        images: {
          where: { id: imageId },
          select: {
            id: true,
            name: true,
            path: true
          }
        }
      }
    });

    characterLogger.info('Imagen agregada al personaje:', { characterId: params.id, imageId });
    return NextResponse.json(character.images[0]);
  } catch (error) {
    characterLogger.error('Error al agregar imagen al personaje:', error);
    return NextResponse.json({ error: 'Error al agregar imagen al personaje' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { imageId } = await request.json();
    characterLogger.info("🗑️ Removiendo imagen del personaje:", {
      characterId: params.id,
      imageId,
    });

    await prisma.character.update({
      where: {
        id: params.id,
      },
      data: {
        images: {
          disconnect: {
            id: imageId,
          },
        },
      },
    });

    characterLogger.info("✅ Imagen removida del personaje");

    return NextResponse.json({ success: true });
  } catch (error) {
    characterLogger.error("❌ Error al remover imagen:", error);
    return NextResponse.json(
      { error: "Error al remover imagen" },
      { status: 500 }
    );
  }
}