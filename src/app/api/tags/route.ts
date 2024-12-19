import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { images: true }
        }
      }
    })

    const tagsWithStats = tags.map(tag => ({
      ...tag,
      count: tag._count.images,
      size: '0 B', // TODO: Calcular el tamaño real
    }))

    return NextResponse.json(tagsWithStats)
  } catch (error) {
    console.error('Error getting tags:', error)
    return NextResponse.json(
      { error: 'Error getting tags' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        color: data.color || '#3b82f6',
        description: data.description,
        shortcut: data.shortcut
      }
    })

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: 'Error creating tag' },
      { status: 500 }
    )
  }
}
