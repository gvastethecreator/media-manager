import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('GET /api/folders/[id]/images - Inicio');
  console.log('Params:', params);

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const folderId = params.id;

    console.log('Query params:', { page, pageSize, folderId });

    // Verificamos que la carpeta exista
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        _count: {
          select: { images: true }
        }
      }
    });

    if (!folder) {
      console.log('Carpeta no encontrada:', folderId);
      return NextResponse.json(
        { error: 'Carpeta no encontrada' },
        { status: 404 }
      );
    }

    console.log('Carpeta encontrada:', {
      id: folder.id,
      name: folder.name,
      imageCount: folder._count.images
    });

    // Obtenemos las imágenes de la carpeta con paginación
    const images = await prisma.image.findMany({
      where: { folderId },
      orderBy: [
        { updatedAt: 'desc' },
        { name: 'asc' }
      ],
      skip: page * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        path: true,
        size: true,
        width: true,
        height: true,
        hash: true,
        metadata: true,
        thumbnailSize: true,
        thumbnailWidth: true,
        thumbnailHeight: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        folderId: true,
        tags: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        stats: {
          select: {
            views: true,
            downloads: true,
            lastViewed: true
          }
        }
      }
    });

    console.log(`Encontradas ${images.length} imágenes`);

    // Agregamos headers de paginación
    const headers = new Headers();
    headers.set('x-total-count', folder._count.images.toString());
    headers.set('x-page-size', pageSize.toString());
    headers.set('x-current-page', page.toString());
    headers.set('Content-Type', 'application/json');

    const response = NextResponse.json(images, {
      headers,
      status: 200
    });

    console.log('GET /api/folders/[id]/images - Éxito');
    return response;
  } catch (error) {
    console.error('Error al obtener imágenes:', error);
    return NextResponse.json(
      { error: 'Error al obtener las imágenes', details: error instanceof Error ? error.message : 'Error desconocido' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}