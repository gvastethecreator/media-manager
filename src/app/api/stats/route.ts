import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      totalFiles,
      totalSize,
      totalCollections,
      totalFolders,
      totalTags,
      recentlyAdded,
      recentlyModified,
      duplicates
    ] = await Promise.all([
      prisma.image.count(),
      prisma.image.aggregate({
        _sum: {
          size: true
        }
      }),
      prisma.collection.count(),
      prisma.folder.count(),
      prisma.tag.count(),
      prisma.image.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // últimos 7 días
          }
        }
      }),
      prisma.image.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // últimos 7 días
          }
        }
      }),
      prisma.image.groupBy({
        by: ['hash'],
        having: {
          _count: {
            hash: {
              gt: 1
            }
          }
        }
      }).then(groups => groups.length)
    ])

    return NextResponse.json({
      totalFiles,
      totalSize: totalSize._sum.size || 0,
      totalCollections,
      totalFolders,
      totalTags,
      recentlyAdded,
      recentlyModified,
      duplicates
    })
  } catch (error) {
    console.error('Error en GET /api/stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
