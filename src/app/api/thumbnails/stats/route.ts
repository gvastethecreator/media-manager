import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener estadísticas principales
    const [
      totalImages,
      totalWithThumbnail,
      totalWithError,
      totalSize,
      recentlyProcessed,
      errors
    ] = await Promise.all([
      prisma.image.count(),
      prisma.image.count({
        where: { thumbnail: { not: null } }
      }),
      prisma.image.count({
        where: { thumbnailError: { not: null } }
      }),
      prisma.image.aggregate({
        _sum: { thumbnailSize: true }
      }),
      prisma.image.findMany({
        where: {
          thumbnail: { not: null },
          thumbnailError: null
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          path: true,
          updatedAt: true
        }
      }),
      prisma.image.findMany({
        where: { thumbnailError: { not: null } },
        orderBy: { thumbnailErrorAt: 'desc' },
        take: 50,
        select: {
          id: true,
          path: true,
          thumbnailError: true,
          thumbnailErrorAt: true
        }
      })
    ]).catch(error => {
      console.error('Error en consulta:', error);
      throw new Error('Error al obtener estadísticas de la base de datos');
    });

    // Validar que tenemos datos válidos
    if (totalImages === undefined || totalImages === null) {
      throw new Error('No se pudieron obtener las estadísticas de imágenes');
    }

    const response = {
      total: totalImages,
      withThumbnail: totalWithThumbnail || 0,
      pending: totalImages - (totalWithThumbnail || 0) - (totalWithError || 0),
      totalSize: totalSize?._sum?.thumbnailSize || 0,
      recentlyProcessed: (recentlyProcessed || []).map(img => ({
        id: img.id,
        path: img.path,
        processedAt: img.updatedAt
      })),
      errors: (errors || []).map(err => ({
        imageId: err.id,
        imagePath: err.path,
        error: err.thumbnailError || 'Error desconocido',
        timestamp: err.thumbnailErrorAt || new Date()
      }))
    };

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);

    const errorResponse = {
      error: 'Error al obtener estadísticas',
      details: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    };

    return new NextResponse(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}