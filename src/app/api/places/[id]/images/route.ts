import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const placeLogger = logger.withContext('PlaceAPI')

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const place = await prisma.place.findUnique({
      where: { id: params.id },
      include: {
        images: {
          select: {
            id: true,
            name: true,
            path: true,
            size: true,
            width: true,
            height: true,
            isFavorite: true,
            createdAt: true,
            updatedAt: true,
            tags: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            collections: {
              select: {
                id: true,
                name: true,
                emoji: true,
                color: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!place) {
      return NextResponse.json({ error: 'Lugar no encontrado' }, { status: 404 })
    }

    return NextResponse.json(place.images)
  } catch (error) {
    placeLogger.error('Error al obtener imágenes del lugar:', error)
    return NextResponse.json({ error: 'Error al obtener imágenes del lugar' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const { imageId } = data

    const place = await prisma.place.update({
      where: { id: params.id },
      data: {
        images: {
          connect: { id: imageId }
        }
      },
      include: {
        images: {
          where: { id: imageId },
          select: {
            id: true,
            name: true,
            path: true
          }
        }
      }
    })

    placeLogger.info('Imagen agregada al lugar:', { placeId: params.id, imageId })
    return NextResponse.json(place.images[0])
  } catch (error) {
    placeLogger.error('Error al agregar imagen al lugar:', error)
    return NextResponse.json({ error: 'Error al agregar imagen al lugar' }, { status: 500 })
  }
}