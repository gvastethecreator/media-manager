import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Verificar directorio de miniaturas
    const thumbnailDir = path.join(process.cwd(), 'thumbnails')
    try {
      await fs.access(thumbnailDir)
    } catch {
      await fs.mkdir(thumbnailDir, { recursive: true })
    }

    // Obtener estadísticas
    const [imagesWithThumbnails, imagesWithoutThumbnails] = await Promise.all([
      prisma.image.count({
        where: { thumbnail: { not: null } }
      }),
      prisma.image.count({
        where: { thumbnail: null }
      })
    ])

    // Obtener errores recientes (últimas 24 horas)
    const recentErrors = await prisma.image.findMany({
      where: {
        thumbnailError: { not: null },
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      select: {
        id: true,
        path: true,
        thumbnailError: true,
        updatedAt: true
      }
    })

    const stats = {
      total: imagesWithThumbnails + imagesWithoutThumbnails,
      totalSize: 0, // TODO: Implementar cálculo de tamaño total
      pending: imagesWithoutThumbnails,
      errors: recentErrors.map(error => ({
        imageId: error.id,
        imagePath: error.path,
        error: error.thumbnailError || 'Error desconocido',
        timestamp: error.updatedAt
      }))
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error al obtener estadísticas de miniaturas:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de miniaturas' },
      { status: 500 }
    )
  }
}