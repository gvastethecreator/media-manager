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
  currentFile?: string
}

export interface FolderEvent {
  type: 'progress' | 'error' | 'complete'
  data: {
    current?: number
    total?: number
    progress?: number
    currentFile?: string
    file?: string
    error?: string
    folder?: Folder
  }
}

export interface AddFolderOptions {
  path: string
  thumbnailQuality?: ThumbnailQuality
}

export interface ReindexFolderOptions {
  id: string
  onProgress?: (progress: FolderProgress) => void
  onError?: (error: Error) => void
  onComplete?: (folder: Folder) => void
}

export type ThumbnailQuality = 'low' | 'mid' | 'high'

export const THUMBNAIL_QUALITY_CONFIG = {
  low: {
    width: 150,
    height: 150,
    quality: 60,
  },
  mid: {
    width: 300,
    height: 300,
    quality: 75,
  },
  high: {
    width: 600,
    height: 600,
    quality: 85,
  },
} as const

/**
 * Agrega una nueva carpeta al sistema
 */
export async function addFolder(options: AddFolderOptions): Promise<Folder> {
  const { path, thumbnailQuality = 'mid' } = options

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
      throw new Error(error.message || 'Error adding folder')
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let folder: Folder | null = null

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const events = chunk
          .split('\n')
          .filter(Boolean)
          .map(line => {
            try {
              return JSON.parse(line) as FolderEvent
            } catch (error) {
              console.error('Error parsing event:', error)
              return null
            }
          })
          .filter((event): event is FolderEvent => event !== null)

        for (const event of events) {
          switch (event.type) {
            case 'complete':
              if (event.data.folder) {
                folder = event.data.folder
              }
              break
            case 'error':
              console.error('Error processing file:', event.data.file, event.data.error)
              break
            default:
              break
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    if (!folder) {
      throw new Error('No folder data received')
    }

    return folder
  } catch (error) {
    console.error('Error en addFolder:', error)
    throw error
  }
}

/**
 * Reindexar una carpeta existente
 */
export async function reindexFolder(options: ReindexFolderOptions): Promise<void> {
  const { id, onProgress, onError, onComplete } = options

  try {
    const response = await fetch(`/api/folders/reindex/${id}`, {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error reindexing folder')
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const events = chunk
          .split('\n')
          .filter(Boolean)
          .map(line => {
            try {
              return JSON.parse(line) as FolderEvent
            } catch (error) {
              console.error('Error parsing event:', error)
              return null
            }
          })
          .filter((event): event is FolderEvent => event !== null)

        for (const event of events) {
          switch (event.type) {
            case 'progress':
              if (onProgress && event.data.current && event.data.total) {
                onProgress({
                  current: event.data.current,
                  total: event.data.total,
                  progress: event.data.progress || 0,
                  currentFile: event.data.currentFile,
                })
              }
              break
            case 'error':
              if (onError && event.data.error) {
                onError(new Error(event.data.error))
              }
              break
            case 'complete':
              if (onComplete && event.data.folder) {
                onComplete(event.data.folder)
              }
              break
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  } catch (error) {
    console.error('Error en reindexFolder:', error)
    throw error
  }
}

/**
 * Obtener todas las carpetas
 */
export async function getFolders(): Promise<Folder[]> {
  try {
    const response = await fetch('/api/folders')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error getting folders')
    }
    return await response.json()
  } catch (error) {
    console.error('Error en getFolders:', error)
    throw error
  }
}

/**
 * Eliminar una carpeta
 */
export async function removeFolder(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/folders/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error removing folder')
    }
  } catch (error) {
    console.error('Error en removeFolder:', error)
    throw error
  }
}

/**
 * Obtener estadísticas de indexación
 */
export interface IndexStats {
  totalFolders: number
  totalFiles: number
  totalSize: number
  lastIndexed: Date | null
}

export async function getIndexStats(): Promise<IndexStats> {
  try {
    const response = await fetch('/api/folders/stats')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error getting stats')
    }

    const stats = await response.json()
    return {
      ...stats,
      lastIndexed: stats.lastIndexed ? new Date(stats.lastIndexed) : null,
    }
  } catch (error) {
    console.error('Error en getIndexStats:', error)
    throw error
  }
}

/**
 * Reindexar todas las carpetas
 */
export async function reindexAll(): Promise<void> {
  try {
    const response = await fetch('/api/folders/reindex', {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error reindexing all folders')
    }
  } catch (error) {
    console.error('Error en reindexAll:', error)
    throw error
  }
}

export const folderService = {
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
}
