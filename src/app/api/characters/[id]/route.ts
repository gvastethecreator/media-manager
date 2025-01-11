import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { formatBytes } from "@/lib/utils";

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
      return NextResponse.json({ error: 'Personaje no encontrado' }, { status: 404 });
    }

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

    const processedCharacter = {
      id: character.id,
      name: character.name,
      emoji: character.emoji || '👤',
      color: character.color || '#3b82f6',
      description: character.description || '',
      shortcut: character.shortcut,
      count: character._count.images,
      size: formatBytes(totalSize),
      topTags
    };

    return NextResponse.json(processedCharacter);
  } catch (error) {
    characterLogger.error('Error al obtener personaje:', error);
    return NextResponse.json({ error: 'Error al obtener personaje' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const character = await prisma.character.update({
      where: { id: params.id },
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

    characterLogger.info('Personaje actualizado:', character);
    return NextResponse.json(character);
  } catch (error) {
    characterLogger.error('Error al actualizar personaje:', error);
    return NextResponse.json({ error: 'Error al actualizar personaje' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.character.delete({
      where: { id: params.id }
    });

    characterLogger.info('Personaje eliminado:', params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    characterLogger.error('Error al eliminar personaje:', error);
    return NextResponse.json({ error: 'Error al eliminar personaje' }, { status: 500 });
  }
}