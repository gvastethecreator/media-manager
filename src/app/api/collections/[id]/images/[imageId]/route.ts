import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const apiLogger = logger.withContext('CollectionsAPI')

export async function POST(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const { id, imageId } = params

    // Verificar si la imagen ya está en la colección
    const existingImage = await prisma.collection.findFirst({
      where: {
        id,
        images: {
          some: {
            id: imageId,
          },
        },
      },
    })

    if (existingImage) {
      apiLogger.info('ℹ️ Imagen ya existe en la colección:', { id, imageId })
      return NextResponse.json({ success: true })
    }

    // Agregar la imagen a la colección
    await prisma.collection.update({
      where: {
        id,
      },
      data: {
        images: {
          connect: {
            id: imageId,
          },
        },
      },
    })

    apiLogger.info('📸 Imagen agregada a la colección:', { id, imageId })
    return NextResponse.json({ success: true })
  } catch (error) {
    apiLogger.error('❌ Error agregando imagen a la colección:', error)
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
  try {
    const { id, imageId } = params

    await prisma.collection.update({
      where: {
        id,
      },
      data: {
        images: {
          disconnect: {
            id: imageId,
          },
        },
      },
    })

    apiLogger.info('🗑️ Imagen eliminada de la colección:', { id, imageId })
    return NextResponse.json({ success: true })
  } catch (error) {
    apiLogger.error('❌ Error eliminando imagen de la colección:', error)
    return NextResponse.json(
      { error: 'Error eliminando imagen de la colección' },
      { status: 500 }
    )
  }
}