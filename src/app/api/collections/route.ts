import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      include: {
        images: {
          select: {
            id: true,
            path: true,
            size: true,
            tags: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 9
        },
        _count: {
          select: {
            images: true
          }
        }
      }
    })

    const processedCollections = await Promise.all(collections.map(async (collection) => {
      const totalSize = collection.images.reduce((sum, img) => sum + img.size, 0)

      const tagCounts = collection.images.reduce((acc, img) => {
        img.tags.forEach(tag => {
          acc[tag.name] = (acc[tag.name] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>)

      const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }))

      const recentImages = collection.images.map(img => `/api/thumbnails/${img.id}`)

      return {
        id: collection.id,
        name: collection.name,
        emoji: collection.emoji || '📁',
        color: collection.color || '#3b82f6',
        description: collection.description || '',
        shortcut: collection.shortcut,
        count: collection._count.images,
        size: formatBytes(totalSize),
        recentImages,
        topTags
      }
    }))

    return NextResponse.json(processedCollections)
  } catch (error) {
    console.error('Error al obtener colecciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener colecciones' },
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
        sortBy: data.sortBy || 'name',
        filters: JSON.stringify(data.filters || [])
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

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      )
    }

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        ...updateData,
        filters: updateData.filters ? JSON.stringify(updateData.filters) : undefined
      }
    })

    return NextResponse.json(collection)
  } catch (error) {
    console.error('Error updating collection:', error)
    return NextResponse.json(
      { error: 'Error updating collection' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Collection ID is required' },
        { status: 400 }
      )
    }

    await prisma.collection.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting collection:', error)
    return NextResponse.json(
      { error: 'Error deleting collection' },
      { status: 500 }
    )
  }
}
