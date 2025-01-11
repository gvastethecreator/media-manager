import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatBytes } from '@/lib/format'
import { logger } from '@/lib/logger'

const placeLogger = logger.withContext('PlaceAPI')

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const place = await prisma.place.findUnique({
      where: { id: params.id },
      include: {
        images: {
          select: {
            size: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            images: true
          }
        }
      }
    })

    if (!place) {
      return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 })
    }

    const totalSize = place.images.reduce((sum, img) => sum + img.size, 0)
    const lastUpdated = place.images.length > 0
      ? place.images.reduce((latest, img) =>
        img.createdAt > latest ? img.createdAt : latest
        , place.images[0].createdAt)
      : null

    const stats = {
      count: place._count.images,
      size: formatBytes(totalSize),
      lastUpdated
    }

    return NextResponse.json(stats)
  } catch (error) {
    placeLogger.error('Error al obtener estadísticas del lugar:', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas del lugar' }, { status: 500 })
  }
}