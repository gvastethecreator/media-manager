import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'
import { toastService } from '@/services/toast.service'

const apiLogger = logger.withContext('TagsAPI')

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    // Esperar y extraer los parámetros de manera asíncrona
    const resolvedParams = await Promise.resolve(params);
    const { id: tagId, imageId } = resolvedParams;

    if (!tagId || !imageId) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      );
    }

    try {
      // Verificar si la imagen ya tiene el tag
      const existingTag = await prisma.tag.findFirst({
        where: {
          id: tagId,
          images: {
            some: {
              id: imageId
            }
          }
        }
      });

      if (existingTag) {
        return NextResponse.json(
          { message: 'La imagen ya tiene este tag' },
          { status: 200 }
        );
      }

      // Agregar tag a la imagen
      await prisma.tag.update({
        where: { id: tagId },
        data: {
          images: {
            connect: { id: imageId }
          }
        }
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error adding tag to image:', error);
      return NextResponse.json(
        { error: 'Error al agregar tag a la imagen' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in tag image route:', error);
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

  const tagId = params.id
  const imageId = params.imageId

  try {
    const tag = await prisma.tag.update({
      where: {
        id: tagId,
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
    statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE)
    toastService.tag.imageRemoved(tag.name)

    apiLogger.info('🗑️ Tag eliminado de la imagen:', { tagId, imageId })
    return NextResponse.json({ success: true, tag })
  } catch (error) {
    apiLogger.error('❌ Error eliminando tag de la imagen:', error)
    toastService.system.error('Error eliminando tag de la imagen')
    return NextResponse.json(
      { error: 'Error eliminando tag de la imagen' },
      { status: 500 }
    )
  }
}