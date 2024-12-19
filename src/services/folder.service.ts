import { prisma } from '@/lib/prisma'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { Image, Folder } from '@prisma/client'
import { ThumbnailQuality } from './thumbnail.service'

// Lista de extensiones de imagen soportadas
const SUPPORTED_IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.svg'
]

export type IndexedFolder = {
  id: string
  path: string
  name: string
  parentId?: string
  isWatched: boolean
  lastIndexed: Date
  totalFiles: number
  totalSize: number
  createdAt: Date
  updatedAt: Date
}

export type IndexedImage = {
  id: string
  name: string
  path: string
  folderId: string
  hash: string
  size: number
  mimeType: string
  width: number
  height: number
  metadata?: any
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

interface FolderStats {
  totalFolders: number
  totalFiles: number
  totalSize: number
  lastIndexed: Date | null
}

export interface FolderProgress {
  current: number
  total: number
  progress: number
  currentFile: string
}

export const folderService = {
  async addFolder(
    path: string,
    thumbnailQuality: ThumbnailQuality = 'mid',
    onProgress?: (progress: FolderProgress) => void,
    onError?: (error: { file: string, error: string }) => void
  ): Promise<Folder> {
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, thumbnailQuality }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al agregar la carpeta')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No se pudo leer la respuesta del servidor')
      }

      let folder: Folder | null = null
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const lines = decoder.decode(value).split('\n').filter(Boolean)
        for (const line of lines) {
          try {
            const message = JSON.parse(line)
            switch (message.type) {
              case 'progress':
                onProgress?.(message.data)
                break
              case 'error':
                onError?.(message.data)
                break
              case 'complete':
                folder = message.data.folder
                break
            }
          } catch (e) {
            console.error('Error parsing message:', e)
          }
        }
      }

      if (!folder) {
        throw new Error('No se recibió la información de la carpeta')
      }

      return folder
    } catch (error) {
      console.error('Error en addFolder:', error)
      throw error
    }
  },

  async getFolders(): Promise<Folder[]> {
    try {
      const response = await fetch('/api/folders')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al obtener las carpetas')
      }
      return await response.json()
    } catch (error) {
      console.error('Error en getFolders:', error)
      throw error
    }
  },

  async removeFolder(folderId: string): Promise<void> {
    try {
      const response = await fetch(`/api/folders?id=${folderId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar la carpeta')
      }
    } catch (error) {
      console.error('Error en removeFolder:', error)
      throw error
    }
  },

  async getIndexStats(): Promise<FolderStats> {
    try {
      const response = await fetch('/api/folders/stats')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al obtener las estadísticas')
      }

      const stats = await response.json()
      return {
        ...stats,
        lastIndexed: stats.lastIndexed ? new Date(stats.lastIndexed) : null
      }
    } catch (error) {
      console.error('Error en getIndexStats:', error)
      throw error
    }
  },

  async reindexAll(): Promise<void> {
    try {
      const response = await fetch('/api/folders/reindex', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al reindexar las carpetas')
      }
    } catch (error) {
      console.error('Error en reindexAll:', error)
      throw error
    }
  },

  async reindexFolder(folderId: string) {
    try {
      const response = await fetch(`/api/folders/reindex/${folderId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error interno del servidor')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en reindexFolder:', error)
      throw error
    }
  },
}
