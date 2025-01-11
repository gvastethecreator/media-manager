import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatBytes } from "@/lib/format";
import { logger } from "@/lib/logger";

const objectLogger = logger.withContext("ObjectAPI");

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const object = await prisma.object.findUnique({
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

    if (!object) {
      return NextResponse.json({ error: 'Objeto no encontrado' }, { status: 404 });
    }

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

    const processedObject = {
      id: object.id,
      name: object.name,
      emoji: object.emoji || '🎯',
      color: object.color || '#3b82f6',
      description: object.description || '',
      shortcut: object.shortcut,
      count: object._count.images,
      size: formatBytes(totalSize),
      topTags
    };

    return NextResponse.json(processedObject);
  } catch (error) {
    objectLogger.error('Error al obtener objeto:', error);
    return NextResponse.json({ error: 'Error al obtener objeto' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const object = await prisma.object.update({
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

    objectLogger.info('Objeto actualizado:', object);
    return NextResponse.json(object);
  } catch (error) {
    objectLogger.error('Error al actualizar objeto:', error);
    return NextResponse.json({ error: 'Error al actualizar objeto' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.object.delete({
      where: { id: params.id }
    });

    objectLogger.info('Objeto eliminado:', params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    objectLogger.error('Error al eliminar objeto:', error);
    return NextResponse.json({ error: 'Error al eliminar objeto' }, { status: 500 });
  }
}