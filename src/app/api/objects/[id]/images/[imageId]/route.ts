import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const objectLogger = logger.withContext('ObjectAPI')

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    await prisma.object.update({
      where: { id: params.id },
      data: {
        images: {
          disconnect: { id: params.imageId }
        }
      }
    })

    objectLogger.info('Imagen removida del objeto:', { objectId: params.id, imageId: params.imageId })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    objectLogger.error('Error al remover imagen del objeto:', error)
    return NextResponse.json({ error: 'Error al remover imagen del objeto' }, { status: 500 })
  }
}