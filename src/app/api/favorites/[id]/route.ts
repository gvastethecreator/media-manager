import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const apiLogger = logger.withContext('FavoritesAPI')

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await prisma.favorite.delete({
      where: {
        id,
      },
    })

    apiLogger.info('🗑️ Favorito eliminado:', { id })
    return NextResponse.json({ success: true })
  } catch (error) {
    apiLogger.error('❌ Error eliminando favorito:', error)
    return NextResponse.json(
      { error: 'Error eliminando favorito' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const favorite = await prisma.favorite.findUnique({
      where: {
        id,
      },
      include: {
        image: {
          include: {
            tags: true,
            collections: true,
          },
        },
      },
    })

    if (!favorite) {
      return NextResponse.json(
        { error: 'Favorito no encontrado' },
        { status: 404 }
      )
    }

    apiLogger.info('📥 Favorito obtenido:', { id })
    return NextResponse.json(favorite)
  } catch (error) {
    apiLogger.error('❌ Error obteniendo favorito:', error)
    return NextResponse.json(
      { error: 'Error obteniendo favorito' },
      { status: 500 }
    )
  }
}