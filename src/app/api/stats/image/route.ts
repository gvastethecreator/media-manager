import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const statsLogger = logger.withContext('ImageStatsAPI')

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')

    if (!imageId) {
      return NextResponse.json({ error: 'imageId es requerido' }, { status: 400 })
    }

    const stats = await prisma.imageStats.findUnique({
      where: { imageId }
    })

    if (!stats) {
      // Crear estadísticas si no existen
      const newStats = await prisma.imageStats.create({
        data: {
          imageId,
          views: 0,
          downloads: 0,
          lastViewed: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      return NextResponse.json(newStats)
    }

    return NextResponse.json(stats)
  } catch (error) {
    statsLogger.error('❌ Error al obtener estadísticas de imagen:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de imagen' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')
    const action = searchParams.get('action')

    if (!imageId || !action) {
      return NextResponse.json(
        { error: 'imageId y action son requeridos' },
        { status: 400 }
      )
    }

    let stats = await prisma.imageStats.findUnique({
      where: { imageId }
    })

    if (!stats) {
      stats = await prisma.imageStats.create({
        data: {
          imageId,
          views: 0,
          downloads: 0,
          lastViewed: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    // Actualizar estadísticas según la acción
    switch (action) {
      case 'view':
        stats = await prisma.imageStats.update({
          where: { id: stats.id },
          data: {
            views: { increment: 1 },
            lastViewed: new Date(),
            updatedAt: new Date()
          }
        })
        break
      case 'download':
        stats = await prisma.imageStats.update({
          where: { id: stats.id },
          data: {
            downloads: { increment: 1 },
            updatedAt: new Date()
          }
        })
        break
      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }

    return NextResponse.json(stats)
  } catch (error) {
    statsLogger.error('❌ Error al actualizar estadísticas de imagen:', error)
    return NextResponse.json(
      { error: 'Error al actualizar estadísticas de imagen' },
      { status: 500 }
    )
  }
}