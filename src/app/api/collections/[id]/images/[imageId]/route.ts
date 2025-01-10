import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'
import { toastService } from '@/services/toast.service'

const apiLogger = logger.withContext('CollectionsAPI')

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    // Esperar y extraer los parámetros de manera asíncrona
    const resolvedParams = await Promise.resolve(params);
    const { id: collectionId, imageId } = resolvedParams;

    if (!collectionId || !imageId) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    try {
      // Verificar si la imagen ya está en la colección
      const existingImage = await prisma.collection.findFirst({
        where: {
          id: collectionId,
          images: {
            some: {
              id: imageId
            }
          }
        }
      });

      if (existingImage) {
        return NextResponse.json(
          { message: 'La imagen ya está en la colección' },
          { status: 200 }
        );
      }

      // Agregar imagen a la colección
      await prisma.collection.update({
        where: { id: collectionId },
        data: {
          images: {
            connect: { id: imageId }
          }
        }
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error adding image to collection:', error);
      return NextResponse.json(
        { error: 'Error al agregar imagen a la colección' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in collection image route:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
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