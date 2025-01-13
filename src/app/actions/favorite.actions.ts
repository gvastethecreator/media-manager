'use server'

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import type { Favorite } from '@prisma/client'
import { eventsService } from '@/services/events.service'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'
import type { FileItem } from '@/types/file-item'

const favoriteLogger = logger.withContext('FavoriteActions')

const REVALIDATE_PATHS = [
  '/settings',
  '/favorites',
  '/images/[id]'
] as const

const revalidateAllPaths = () => {
  REVALIDATE_PATHS.forEach(path => revalidatePath(path))
  favoriteLogger.info('🔄 Rutas revalidadas')
}

class FavoriteError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'FavoriteError'
  }
}

export interface FavoriteWithImage extends Favorite {
  image: FileItem
}

export async function addToFavorites(imageId: string): Promise<FavoriteWithImage> {
  try {
    favoriteLogger.info('⭐ Agregando imagen a favoritos:', imageId)
    const favorite = await prisma.favorite.create({
      data: {
        imageId,
        createdAt: new Date()
      },
      include: {
        image: {
          include: {
            tags: true,
            collections: true
          }
        }
      }
    })

    // Actualizar el campo isFavorite de la imagen
    await prisma.image.update({
      where: { id: imageId },
      data: { isFavorite: true }
    })

    // Emitir eventos
    statsEventEmitter.emit(STATS_EVENTS.FAVORITE_CHANGE)
    eventsService.emit('files:modified')
    revalidateAllPaths()

    favoriteLogger.info('✅ Imagen agregada a favoritos:', imageId)
    return favorite as FavoriteWithImage
  } catch (error) {
    favoriteLogger.error('❌ Error al agregar a favoritos:', { imageId, error })
    throw new FavoriteError('No se pudo agregar la imagen a favoritos', error)
  }
}

export async function removeFromFavorites(imageId: string): Promise<void> {
  try {
    favoriteLogger.info('🗑️ Eliminando imagen de favoritos:', imageId)
    await prisma.favorite.deleteMany({
      where: { imageId }
    })

    // Actualizar el campo isFavorite de la imagen
    await prisma.image.update({
      where: { id: imageId },
      data: { isFavorite: false }
    })

    // Emitir eventos
    statsEventEmitter.emit(STATS_EVENTS.FAVORITE_CHANGE)
    eventsService.emit('files:modified')
    revalidateAllPaths()

    favoriteLogger.info('✅ Imagen eliminada de favoritos:', imageId)
  } catch (error) {
    favoriteLogger.error('❌ Error al eliminar de favoritos:', { imageId, error })
    throw new FavoriteError('No se pudo eliminar la imagen de favoritos', error)
  }
}

export async function getFavorites(): Promise<FavoriteWithImage[]> {
  try {
    favoriteLogger.info('📥 Obteniendo lista de favoritos')
    const favorites = await prisma.favorite.findMany({
      include: {
        image: {
          include: {
            tags: true,
            collections: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    favoriteLogger.info('✅ Favoritos obtenidos:', { count: favorites.length })
    return favorites as FavoriteWithImage[]
  } catch (error) {
    favoriteLogger.error('❌ Error al obtener favoritos:', error)
    throw new FavoriteError('No se pudieron obtener los favoritos', error)
  }
}

export async function isFavorited(imageId: string): Promise<boolean> {
  try {
    const favorite = await prisma.favorite.findFirst({
      where: { imageId }
    })
    return !!favorite
  } catch (error) {
    favoriteLogger.error('❌ Error al verificar favorito:', { imageId, error })
    throw new FavoriteError('No se pudo verificar si la imagen está en favoritos', error)
  }
}

export async function toggleFavorite(imageId: string): Promise<boolean> {
  try {
    const isFav = await isFavorited(imageId)
    if (isFav) {
      await removeFromFavorites(imageId)
      return false
    } else {
      await addToFavorites(imageId)
      return true
    }
  } catch (error) {
    favoriteLogger.error('❌ Error al alternar favorito:', { imageId, error })
    throw new FavoriteError('No se pudo alternar el estado de favorito', error)
  }
}

export async function getRecentFavorites(limit: number = 10): Promise<FavoriteWithImage[]> {
  try {
    favoriteLogger.info('📥 Obteniendo favoritos recientes')
    const favorites = await prisma.favorite.findMany({
      take: limit,
      include: {
        image: {
          include: {
            tags: true,
            collections: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    favoriteLogger.info('✅ Favoritos recientes obtenidos:', { count: favorites.length })
    return favorites as FavoriteWithImage[]
  } catch (error) {
    favoriteLogger.error('❌ Error al obtener favoritos recientes:', error)
    throw new FavoriteError('No se pudieron obtener los favoritos recientes', error)
  }
}