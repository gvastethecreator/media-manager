import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      include: {
        _count: {
          select: { images: true }
        }
      }
    })

    const collectionsWithStats = collections.map(collection => ({
      ...collection,
      count: collection._count.images,
      size: '0 B', // TODO: Calcular el tamaño real
    }))

    return NextResponse.json(collectionsWithStats)
  } catch (error) {
    console.error('Error getting collections:', error)
    return NextResponse.json(
      { error: 'Error getting collections' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const collection = await prisma.collection.create({
      data: {
        name: data.name,
        emoji: data.emoji || '🌟',
        description: data.description,
        color: data.color || '#3b82f6',
        shortcut: data.shortcut,
        sortBy: 'name',
        filters: []
      }
    })

    return NextResponse.json(collection)
  } catch (error) {
    console.error('Error creating collection:', error)
    return NextResponse.json(
      { error: 'Error creating collection' },
      { status: 500 }
    )
  }
}
