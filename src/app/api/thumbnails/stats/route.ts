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
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          path: true,
          thumbnailError: true,
          updatedAt: true
        }
      })
    ]).catch(error => {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error en consulta:', { error: errorMessage });
      throw new Error('Error al obtener estadísticas de la base de datos');
    });

    // Validar que tenemos datos válidos
    if (!totalImages && totalImages !== 0) {
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
        timestamp: err.updatedAt
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error obteniendo estadísticas:', { error: errorMessage });

    return NextResponse.json({
      error: 'Error al obtener estadísticas',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}