import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const images = await prisma.image.findMany({
      orderBy: {
        updatedAt: 'desc'
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

    return NextResponse.json({ items: images })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}