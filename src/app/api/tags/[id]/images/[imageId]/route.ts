import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'
import { toastService } from '@/services/toast.service'

const apiLogger = logger.withContext('TagsAPI')

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

  const tagId = params.id
  const imageId = params.imageId

  try {
    // Verificar si la imagen ya tiene el tag
    const existingTag = await prisma.tag.findFirst({
      where: {
        id: tagId,
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

    if (existingTag) {
      apiLogger.info('ℹ️ Imagen ya tiene el tag:', { tagId, imageId })
      toastService.tag.imageAdded(existingTag.name)
      return NextResponse.json({ success: true })
    }

    // Agregar el tag a la imagen
    const tag = await prisma.tag.update({
      where: {
        id: tagId,
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
    statsEventEmitter.emit(STATS_EVENTS.TAG_CHANGE)
    toastService.tag.imageAdded(tag.name)

    apiLogger.info('🏷️ Tag agregado a la imagen:', { tagId, imageId })
    return NextResponse.json({ success: true, tag })
  } catch (error) {
    apiLogger.error('❌ Error agregando tag a la imagen:', error)
    toastService.system.error('Error agregando tag a la imagen')
    return NextResponse.json(
      { error: 'Error agregando tag a la imagen' },
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