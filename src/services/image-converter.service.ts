import type { FileItem } from '@/types/file-item'
import { logger } from '@/lib/logger'

const converterLogger = logger.withContext('ImageConverter')

export interface ServerImage {
  id: string
  name: string
  path: string
  size: number
  width: number | null
  height: number | null
  metadata: string | null
  thumbnail: Buffer | null
  thumbnailSize: number | null
  thumbnailWidth: number | null
  thumbnailHeight: number | null
  isPublic: boolean
  isFavorite: boolean
  folderId: string
  createdAt: Date
  updatedAt: Date
  collections?: Array<{
    id: string
    name: string
    emoji: string
    color: string
  }>
  tags?: Array<{
    id: string
    name: string
    color: string
  }>
  albums?: Array<{
    id: string
    name: string
    emoji: string
    color: string
  }>
  characters?: Array<{
    id: string
    name: string
    emoji: string
    color: string
    level?: number
    class?: string
    race?: string
  }>
  places?: Array<{
    id: string
    name: string
    emoji: string
    color: string
    region?: string
    type?: string
    climate?: string
  }>
  objects?: Array<{
    id: string
    name: string
    emoji: string
    color: string
    type?: string
    rarity?: string
  }>
}

const validateMetadata = (metadata: string | null): Record<string, any> | undefined => {
  if (!metadata) return undefined
  try {
    const parsed = JSON.parse(metadata)
    return typeof parsed === 'object' ? parsed : undefined
  } catch {
    converterLogger.warn('⚠️ Error al parsear metadata de imagen')
    return undefined
  }
}

export const convertServerImageToFileItem = (image: ServerImage): FileItem => {
  try {
    const metadata = validateMetadata(image.metadata)
    const thumbnail = image.thumbnail
      ? Buffer.from(image.thumbnail).toString('base64')
      : undefined

    return {
      id: image.id,
      name: image.name,
      path: image.path,
      type: 'image',
      size: image.size,
      width: image.width ?? undefined,
      height: image.height ?? undefined,
      metadata,
      thumbnail,
      thumbnailSize: image.thumbnailSize ?? undefined,
      thumbnailWidth: image.thumbnailWidth ?? undefined,
      thumbnailHeight: image.thumbnailHeight ?? undefined,
      createdAt: image.createdAt.toISOString(),
      updatedAt: image.updatedAt.toISOString(),
      isPublic: image.isPublic ?? false,
      isFavorite: image.isFavorite ?? false,
      folderId: image.folderId,
      collections: image.collections ?? [],
      tags: image.tags ?? [],
      albums: image.albums ?? [],
      characters: image.characters ?? [],
      places: image.places ?? [],
      objects: image.objects ?? []
    }
  } catch (error) {
    converterLogger.error('❌ Error al convertir imagen del servidor:', { error, image })
    throw new Error('Error al procesar imagen del servidor')
  }
}

export const imageConverterService = {
  convertServerImageToFileItem
}