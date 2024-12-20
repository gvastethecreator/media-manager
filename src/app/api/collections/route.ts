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
        _count: {
          select: { images: true }
        },
        images: {
          select: { size: true }
        }
      }
    })

    const collectionsWithStats = collections.map(collection => ({
      ...collection,
      filters: collection.filters ? JSON.parse(collection.filters) : [],
      count: collection._count.images,
      size: formatBytes(collection.images.reduce((acc, img) => acc + img.size, 0))
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
