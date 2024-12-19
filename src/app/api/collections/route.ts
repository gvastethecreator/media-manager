import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      select: {
        id: true,
        name: true,
        emoji: true,
        _count: {
          select: {
            files: true
          }
        }
      }
    })

    return NextResponse.json(collections.map(collection => ({
      id: collection.id,
      name: collection.name,
      emoji: collection.emoji,
      count: collection._count.files
    })))
  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json({ error: 'Error fetching collections' }, { status: 500 })
  }
}
