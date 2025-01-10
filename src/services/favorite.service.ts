import type { Favorite } from '.prisma/client'
import type { FileItem } from '@/types/file-item'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'

const favoriteLogger = logger.withContext('FavoriteService')

export interface FavoriteWithImage extends Favorite {
  image: FileItem
}

export const favoriteService = {
  // Add image to favorites
  async addToFavorites(imageId: string): Promise<FavoriteWithImage> {
    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageId }),
    })

    if (!response.ok) {
      throw new Error('Failed to add to favorites')
    }

    // Actualizar el campo isFavorite
    const updateResponse = await fetch(`/api/images/${imageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isFavorite: true }),
    })

    if (!updateResponse.ok) {
      throw new Error('Failed to update image favorite status')
    }

    // Emitir evento de cambio en favoritos
    statsEventEmitter.emit(STATS_EVENTS.FAVORITE_CHANGE)
    return response.json()
  },

  // Remove image from favorites
  async removeFromFavorites(imageId: string): Promise<void> {
    const response = await fetch(`/api/favorites/${imageId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to remove from favorites')
    }

    // Actualizar el campo isFavorite
    const updateResponse = await fetch(`/api/images/${imageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isFavorite: false }),
    })

    if (!updateResponse.ok) {
      throw new Error('Failed to update image favorite status')
    }

    // Emitir evento de cambio en favoritos
    statsEventEmitter.emit(STATS_EVENTS.FAVORITE_CHANGE)
  },

  // Get all favorite images
  async getFavorites(): Promise<FavoriteWithImage[]> {
    const response = await fetch('/api/favorites')

    if (!response.ok) {
      throw new Error('Failed to fetch favorites')
    }

    return response.json()
  },

  // Check if image is favorited
  async isFavorited(imageId: string): Promise<boolean> {
    const response = await fetch(`/api/favorites/${imageId}`)
    return response.ok
  },

  // Toggle favorite status
  async toggleFavorite(imageId: string): Promise<boolean> {
    const isFavorited = await this.isFavorited(imageId)

    if (isFavorited) {
      await this.removeFromFavorites(imageId)
      return false
    } else {
      await this.addToFavorites(imageId)
      return true
    }
  },

  // Get recent favorites
  async getRecentFavorites(limit: number = 10): Promise<FavoriteWithImage[]> {
    const response = await fetch(`/api/favorites?limit=${limit}`)

    if (!response.ok) {
      throw new Error('Failed to fetch recent favorites')
    }

    return response.json()
  },
}
