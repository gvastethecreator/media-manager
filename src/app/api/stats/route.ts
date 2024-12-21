import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Obtener estadísticas principales
    const [
      totalImages,
      totalFolders,
      totalTags,
      totalCollections,
      totalFavorites,
      totalStats
    ] = await Promise.all([
      prisma.image.count(),
      prisma.folder.count(),
      prisma.tag.count(),
      prisma.collection.count(),
      prisma.favorite.count(),
      prisma.imageStats.aggregate({
        _sum: {
          views: true,
          downloads: true
        }
      })
    ])

    // Obtener estadísticas de carpetas
    const folders = await prisma.folder.findMany({
      select: {
        name: true,
        totalSize: true
      },
      orderBy: {
        totalSize: 'desc'
      }
    })

    const totalSize = folders.reduce((sum, folder) => sum + folder.totalSize, 0)
    const folderStats = folders.map(folder => ({
      name: folder.name,
      size: folder.totalSize,
      percentage: (folder.totalSize / totalSize) * 100
    }))

    // Obtener etiquetas más usadas
    const topTags = await prisma.tag.findMany({
      select: {
        name: true,
        color: true,
        _count: {
          select: { images: true }
        }
      },
      orderBy: {
        images: {
          _count: 'desc'
        }
      },
      take: 5
    })

    // Obtener actividad reciente
    const recentActivity = await Promise.all([
      // Imágenes recientes
      prisma.image.findMany({
        select: {
          name: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      // Colecciones recientes
      prisma.collection.findMany({
        select: {
          name: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      // Etiquetas recientes
      prisma.tag.findMany({
        select: {
          name: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])

    const activity = [
      ...recentActivity[0].map(img => ({
        description: `Nueva imagen: ${img.name}`,
        timestamp: img.createdAt.toLocaleString(),
        iconName: 'image'
      })),
      ...recentActivity[1].map(col => ({
        description: `Nueva colección: ${col.name}`,
        timestamp: col.createdAt.toLocaleString(),
        iconName: 'bookmark'
      })),
      ...recentActivity[2].map(tag => ({
        description: `Nueva etiqueta: ${tag.name}`,
        timestamp: tag.createdAt.toLocaleString(),
        iconName: 'tag'
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    const stats = {
      // Estadísticas principales
      totalImages,
      totalFolders,
      totalTags,
      totalCollections,

      // Estadísticas adicionales
      totalFavorites,
      totalViews: totalStats._sum.views || 0,
      totalDownloads: totalStats._sum.downloads || 0,
      totalSize,

      // Estadísticas detalladas
      folderStats,
      topTags: topTags.map(tag => ({
        name: tag.name,
        color: tag.color,
        count: tag._count.images
      })),
      recentActivity: activity
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
