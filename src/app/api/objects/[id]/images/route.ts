import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const objectLogger = logger.withContext('ObjectAPI')

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const object = await prisma.object.findUnique({
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

    if (!object) {
      return NextResponse.json({ error: 'Objeto no encontrado' }, { status: 404 })
    }

    return NextResponse.json(object.images)
  } catch (error) {
    objectLogger.error('Error al obtener imágenes del objeto:', error)
    return NextResponse.json({ error: 'Error al obtener imágenes del objeto' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const { imageId } = data

    const object = await prisma.object.update({
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

    objectLogger.info('Imagen agregada al objeto:', { objectId: params.id, imageId })
    return NextResponse.json(object.images[0])
  } catch (error) {
    objectLogger.error('Error al agregar imagen al objeto:', error)
    return NextResponse.json({ error: 'Error al agregar imagen al objeto' }, { status: 500 })
  }
}