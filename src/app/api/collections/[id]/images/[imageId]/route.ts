import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'
import { toastService } from '@/services/toast.service'

const apiLogger = logger.withContext('CollectionsAPI')

export async function POST(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  if (!params?.id || !params?.imageId) {
    return NextResponse.json(
      { error: 'Parámetros inválidos' },
      { status: 400 }
    )
  }

  const collectionId = params.id
  const imageId = params.imageId

  try {
    // Verificar si la imagen ya está en la colección
    const existingImage = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        images: {
          some: {
            id: imageId,
          },
        },
      },
      include: {
        images: true,
        _count: {
          select: { images: true }
        }
      }
    })

    if (existingImage) {
      apiLogger.info('ℹ️ Imagen ya existe en la colección:', { collectionId, imageId })
      toastService.collection.imageAdded(existingImage.name)
      return NextResponse.json({ success: true })
    }

    // Agregar la imagen a la colección
    const collection = await prisma.collection.update({
      where: {
        id: collectionId,
      },
      data: {
        images: {
          connect: {
            id: imageId,
          },
        },
      },
      include: {
        images: true,
        _count: {
          select: { images: true }
        }
      },
    })

    // Emitir evento de cambio
    statsEventEmitter.emit(STATS_EVENTS.COLLECTION_CHANGE)
    toastService.collection.imageAdded(collection.name)

    apiLogger.info('📸 Imagen agregada a la colección:', { collectionId, imageId })
    return NextResponse.json({ success: true, collection })
  } catch (error) {
    apiLogger.error('❌ Error agregando imagen a la colección:', error)
    toastService.system.error('Error agregando imagen a la colección')
    return NextResponse.json(
      { error: 'Error agregando imagen a la colección' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  if (!params?.id || !params?.imageId) {
    return NextResponse.json(
      { error: 'Parámetros inválidos' },
      { status: 400 }
    )
  }

  const collectionId = params.id
  const imageId = params.imageId

  try {
    const collection = await prisma.collection.update({
      where: {
        id: collectionId,
      },
      data: {
        images: {
          disconnect: {
            id: imageId,
          },
        },
      },
      include: {
        images: true,
        _count: {
          select: { images: true }
        }
      },
    })

    // Emitir evento de cambio
    statsEventEmitter.emit(STATS_EVENTS.COLLECTION_CHANGE)
    toastService.collection.imageRemoved(collection.name)

    apiLogger.info('🗑️ Imagen eliminada de la colección:', { collectionId, imageId })
    return NextResponse.json({ success: true, collection })
  } catch (error) {
    apiLogger.error('❌ Error eliminando imagen de la colección:', error)
    toastService.system.error('Error eliminando imagen de la colección')
    return NextResponse.json(
      { error: 'Error eliminando imagen de la colección' },
      { status: 500 }
    )
  }
}