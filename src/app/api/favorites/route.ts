import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '0')
    const pageSize = parseInt(searchParams.get('pageSize') || '100')

    const skip = page * pageSize
    const take = pageSize

    const favorites = await prisma.favorite.findMany({
      skip,
      take,
      include: {
        image: {
          include: {
            folder: true,
            tags: true,
            collections: true,
            _count: {
              select: {
                tags: true,
                collections: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transformar los datos para que coincidan con el formato esperado
    const images = favorites.map((favorite: any) => ({
      ...favorite.image,
      isFavorite: true,
      favoriteId: favorite.id,
      favoriteDate: favorite.createdAt
    }))

    return NextResponse.json(images)
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { error: 'Error fetching favorites' },
      { status: 500 }
    )
  }
}