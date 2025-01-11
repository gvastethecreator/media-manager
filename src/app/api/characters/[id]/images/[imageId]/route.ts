import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const characterLogger = logger.withContext('CharacterAPI')

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    await prisma.character.update({
      where: { id: params.id },
      data: {
        images: {
          disconnect: { id: params.imageId }
        }
      }
    })

    characterLogger.info('Imagen removida del personaje:', { characterId: params.id, imageId: params.imageId })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    characterLogger.error('Error al remover imagen del personaje:', error)
    return NextResponse.json({ error: 'Error al remover imagen del personaje' }, { status: 500 })
  }
}