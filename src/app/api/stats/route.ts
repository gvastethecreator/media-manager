import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const statsLogger = logger.withContext('StatsAPI')

export async function GET() {
  try {
    // Obtener conteos básicos
    const [totalImages, totalFolders, totalTags, totalCollections] = await Promise.all([
      prisma.image.count(),
      prisma.folder.count(),
      prisma.tag.count(),
      prisma.collection.count()
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

    const stats = {
      totalImages,
      totalFolders,
      totalTags,
      totalCollections,
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
