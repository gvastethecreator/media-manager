import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const pageSize = parseInt(searchParams.get('pageSize') || '100')
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    // Obtener el total de imágenes
    const total = await prisma.image.count()

    // Obtener las imágenes paginadas
    const images = await prisma.image.findMany({
      skip: page * pageSize,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            path: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        collections: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        stats: {
          select: {
            views: true,
            downloads: true,
            lastViewed: true
          }
        }
      }
    })

    // Configurar headers para paginación
    const headers = new Headers()
    headers.set('x-total-count', total.toString())
    headers.set('x-page-size', pageSize.toString())
    headers.set('x-current-page', page.toString())

    return NextResponse.json(images, {
      headers,
      status: 200
    })
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}