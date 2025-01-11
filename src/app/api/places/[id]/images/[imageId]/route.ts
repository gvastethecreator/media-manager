import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const placeLogger = logger.withContext('PlaceAPI')

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    await prisma.place.update({
      where: { id: params.id },
      data: {
        images: {
          disconnect: { id: params.imageId }
        }
      }
    })

    placeLogger.info('Imagen removida del lugar:', { placeId: params.id, imageId: params.imageId })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    placeLogger.error('Error al remover imagen del lugar:', error)
    return NextResponse.json({ error: 'Error al remover imagen del lugar' }, { status: 500 })
  }
}