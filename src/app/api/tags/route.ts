import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: {
            files: true
          }
        }
      }
    })

    return NextResponse.json(tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      count: tag._count.files
    })))
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json({ error: 'Error fetching tags' }, { status: 500 })
  }
}
