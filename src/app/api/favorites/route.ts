import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const apiLogger = logger.withContext('FavoritesAPI')

export async function GET() {
  try {
    const favorites = await prisma.favorite.findMany({
      include: {
        image: {
          include: {
            tags: true,
            collections: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    apiLogger.info('📥 Favoritos obtenidos:', { count: favorites.length })
    return NextResponse.json(favorites)
  } catch (error) {
    apiLogger.error('❌ Error obteniendo favoritos:', error)
    return NextResponse.json(
      { error: 'Error obteniendo favoritos' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { imageId } = await request.json()

    const favorite = await prisma.favorite.create({
      data: {
        imageId,
        createdAt: new Date(),
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

    apiLogger.info('⭐ Favorito creado:', { imageId })
    return NextResponse.json(favorite)
  } catch (error) {
    apiLogger.error('❌ Error creando favorito:', error)
    return NextResponse.json(
      { error: 'Error creando favorito' },
      { status: 500 }
    )
  }
}