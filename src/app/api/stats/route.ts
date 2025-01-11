import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const statsLogger = logger.withContext('StatsAPI')

export async function GET() {
  try {
    // Obtener conteos básicos
    const [
      totalImages,
      totalFolders,
      totalTags,
      totalCollections,
      totalAlbums,
      totalCharacters,
      totalPlaces,
      totalObjects,
      totalFavorites,
      totalActivities
    ] = await Promise.all([
      prisma.image.count(),
      prisma.folder.count(),
      prisma.tag.count(),
      prisma.collection.count(),
      prisma.album.count(),
      prisma.character.count(),
      prisma.place.count(),
      prisma.object.count(),
      prisma.favorite.count(),
      prisma.activity.count()
    ])

    // Obtener información detallada de carpetas
    const folders = await prisma.folder.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { images: true }
        }
      }
    })

    // Obtener información detallada de colecciones
    const collections = await prisma.collection.findMany({
      select: {
        id: true,
        name: true,
        emoji: true,
        _count: {
          select: { images: true }
        }
      }
    })

    // Obtener información detallada de tags
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: { images: true }
        }
      }
    })

    // Obtener información detallada de álbumes
    const albums = await prisma.album.findMany({
      select: {
        id: true,
        name: true,
        emoji: true,
        _count: {
          select: { images: true }
        }
      }
    })

    // Obtener información detallada de personajes
    const characters = await prisma.character.findMany({
      select: {
        id: true,
        name: true,
        emoji: true,
        _count: {
          select: { images: true }
        }
      }
    })

    // Obtener información detallada de lugares
    const places = await prisma.place.findMany({
      select: {
        id: true,
        name: true,
        emoji: true,
        _count: {
          select: { images: true }
        }
      }
    })

    // Obtener información detallada de objetos
    const objects = await prisma.object.findMany({
      select: {
        id: true,
        name: true,
        emoji: true,
        _count: {
          select: { images: true }
        }
      }
    })

    // Obtener actividad reciente
    const recentActivity = await prisma.activity.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        description: true,
        createdAt: true,
        imageId: true,
        image: {
          select: {
            name: true
          }
        }
      }
    })

    // Obtener estadísticas de imágenes
    const imageStats = await prisma.imageStats.aggregate({
      _sum: {
        views: true,
        downloads: true
      }
    })

    // Obtener tamaño total de imágenes
    const totalSize = await prisma.image.aggregate({
      _sum: {
        size: true
      }
    })

    const stats = {
      // Conteos básicos
      totalImages,
      totalFolders,
      totalTags,
      totalCollections,
      totalAlbums,
      totalCharacters,
      totalPlaces,
      totalObjects,
      totalFavorites,
      totalViews: imageStats._sum.views || 0,
      totalDownloads: imageStats._sum.downloads || 0,
      totalSize: totalSize._sum.size || 0,
      totalActivities,

      // Listas detalladas
      folders: folders.map(f => ({
        id: f.id,
        name: f.name,
        count: f._count.images
      })),
      collections: collections.map(c => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        count: c._count.images
      })),
      tags: tags.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color,
        count: t._count.images
      })),
      albums: albums.map(a => ({
        id: a.id,
        name: a.name,
        emoji: a.emoji,
        count: a._count.images
      })),
      characters: characters.map(c => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        count: c._count.images
      })),
      places: places.map(p => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        count: p._count.images
      })),
      objects: objects.map(o => ({
        id: o.id,
        name: o.name,
        emoji: o.emoji,
        count: o._count.images
      })),
      topTags: tags
        .sort((a, b) => b._count.images - a._count.images)
        .slice(0, 10)
        .map(t => ({
          id: t.id,
          name: t.name,
          color: t.color,
          count: t._count.images
        })),
      recentActivity: recentActivity.map(a => ({
        description: a.description,
        timestamp: a.createdAt.toISOString(),
        imageId: a.imageId || '',
        imageName: a.image?.name || ''
      })),

      // Metadata
      timestamp: Date.now()
    }

    statsLogger.debug('📊 Estadísticas generales calculadas:', stats)
    return NextResponse.json(stats)
  } catch (error) {
    statsLogger.error('❌ Error al obtener estadísticas:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
