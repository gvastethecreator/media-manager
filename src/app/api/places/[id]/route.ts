import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatBytes } from "@/lib/format";
import { logger } from "@/lib/logger";

const placeLogger = logger.withContext("PlaceAPI");

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const place = await prisma.place.findUnique({
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

    if (!place) {
      return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 });
    }

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

    const processedPlace = {
      id: place.id,
      name: place.name,
      emoji: place.emoji || '📍',
      color: place.color || '#3b82f6',
      description: place.description || '',
      shortcut: place.shortcut,
      count: place._count.images,
      size: formatBytes(totalSize),
      topTags
    };

    return NextResponse.json(processedPlace);
  } catch (error) {
    placeLogger.error('Error al obtener lugar:', error);
    return NextResponse.json({ error: 'Error al obtener lugar' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const place = await prisma.place.update({
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

    placeLogger.info('Lugar actualizado:', place);
    return NextResponse.json(place);
  } catch (error) {
    placeLogger.error('Error al actualizar lugar:', error);
    return NextResponse.json({ error: 'Error al actualizar lugar' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.place.delete({
      where: { id: params.id }
    });

    placeLogger.info('Lugar eliminado:', params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    placeLogger.error('Error al eliminar lugar:', error);
    return NextResponse.json({ error: 'Error al eliminar lugar' }, { status: 500 });
  }
}