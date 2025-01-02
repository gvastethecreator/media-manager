import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    console.log('Iniciando obtención de estadísticas...')

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
    ]).catch(error => {
      console.error('Error al obtener estadísticas principales:', error)
      throw new Error('Error al obtener estadísticas principales')
    })

    console.log('Estadísticas principales obtenidas')

    // Obtener estadísticas de carpetas con conteo de imágenes
    const folders = await prisma.folder.findMany({
      select: {
        id: true,
        name: true,
        totalSize: true,
        _count: {
          select: { images: true }
        }
      },
      orderBy: {
        totalSize: 'desc'
      }
    }).catch(error => {
      console.error('Error al obtener estadísticas de carpetas:', error)
      throw new Error('Error al obtener estadísticas de carpetas')
    })

    console.log('Estadísticas de carpetas obtenidas')

    const totalSize = folders.reduce((sum, folder) => sum + (folder.totalSize || 0), 0)
    const folderStats = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      size: folder.totalSize || 0,
      count: folder._count.images,
      percentage: totalSize > 0 ? ((folder.totalSize || 0) / totalSize) * 100 : 0
    }))

    // Obtener etiquetas más usadas con conteo
    const topTags = await prisma.tag.findMany({
      select: {
        id: true,
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
      }
    }).catch(error => {
      console.error('Error al obtener estadísticas de etiquetas:', error)
      throw new Error('Error al obtener estadísticas de etiquetas')
    })

    console.log('Estadísticas de etiquetas obtenidas')

    // Obtener colecciones con conteo
    const collections = await prisma.collection.findMany({
      select: {
        id: true,
        name: true,
        emoji: true,
        color: true,
        _count: {
          select: { images: true }
        }
      },
      orderBy: {
        images: {
          _count: 'desc'
        }
      }
    }).catch(error => {
      console.error('Error al obtener estadísticas de colecciones:', error)
      throw new Error('Error al obtener estadísticas de colecciones')
    })

    console.log('Estadísticas de colecciones obtenidas')

    // Obtener actividad reciente
    const recentActivity = await prisma.imageStats.findMany({
      where: {
        OR: [
          { views: { gt: 0 } },
          { downloads: { gt: 0 } }
        ]
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10,
      include: {
        image: true
      }
    }).catch(error => {
      console.error('Error al obtener actividad reciente:', error)
      throw new Error('Error al obtener actividad reciente')
    })

    console.log('Actividad reciente obtenida')

    const activity = recentActivity.map(stat => ({
      description: stat.views > 0 ? 'Vista' : 'Descarga',
      timestamp: stat.updatedAt.toISOString(),
      imageId: stat.imageId,
      imageName: stat.image.name
    }))

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

      // Listas con conteos
      folders: folderStats,
      tags: topTags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        count: tag._count.images
      })),
      collections: collections.map(collection => ({
        id: collection.id,
        name: collection.name,
        emoji: collection.emoji,
        color: collection.color,
        count: collection._count.images
      })),

      // Estadísticas detalladas
      folderStats,
      topTags: topTags.map(tag => ({
        name: tag.name,
        color: tag.color,
        count: tag._count.images
      })),
      recentActivity: activity
    }

    console.log('Estadísticas procesadas correctamente')

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
