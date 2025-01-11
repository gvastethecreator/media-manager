import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatBytes } from '@/lib/format'
import { logger } from '@/lib/logger'

const objectLogger = logger.withContext('ObjectAPI')

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const object = await prisma.object.findUnique({
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

    if (!object) {
      return NextResponse.json({ error: 'Objeto no encontrado' }, { status: 404 })
    }

    const totalSize = object.images.reduce((sum, img) => sum + img.size, 0)
    const lastUpdated = object.images.length > 0
      ? object.images.reduce((latest, img) =>
        img.createdAt > latest ? img.createdAt : latest
        , object.images[0].createdAt)
      : null

    const stats = {
      count: object._count.images,
      size: formatBytes(totalSize),
      lastUpdated
    }

    return NextResponse.json(stats)
  } catch (error) {
    objectLogger.error('Error al obtener estadísticas del objeto:', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas del objeto' }, { status: 500 })
  }
}