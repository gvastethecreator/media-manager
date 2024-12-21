import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  if (!context?.params?.id) {
    return NextResponse.json(
      { error: 'ID de carpeta no proporcionado' },
      { status: 400 }
    );
  }

  const folderId = context.params.id;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where: {
          folderId
        },
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          name: true,
          path: true,
          size: true,
          width: true,
          height: true,
          createdAt: true,
          updatedAt: true,
          tags: {
            select: {
              id: true,
              name: true,
              color: true
            }
          }
        }
      }),
      prisma.image.count({
        where: {
          folderId
        }
      })
    ]);

    return NextResponse.json({
      images,
      total,
      page,
      limit,
      hasMore: offset + images.length < total
    });
  } catch (error) {
    console.error('Error al obtener imágenes:', error);
    return NextResponse.json(
      { error: 'Error al obtener imágenes' },
      { status: 500 }
    );
  }
}