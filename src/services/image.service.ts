import { prisma } from '@/lib/prisma'
import type { Image } from '@prisma/client'
import { statsService } from './stats.service'
import sharp from 'sharp'
import { thumbnailCache, metadataCache } from '@/lib/cache'
import { createHash } from 'crypto'
import path from 'path'
import { promises as fs } from 'fs'

export type ThumbnailQuality = 'compressed' | 'low' | 'mid' | 'high'

export const THUMBNAIL_QUALITY_CONFIG: Record<ThumbnailQuality, { quality: number, width: number, height: number }> = {
  compressed: { quality: 60, width: 200, height: 200 },
  low: { quality: 70, width: 300, height: 300 },
  mid: { quality: 80, width: 400, height: 400 },
  high: { quality: 90, width: 500, height: 500 }
}

export type CreateImageInput = {
  name: string
  path: string
  size: number
  width: number
  height: number
  hash: string
  folderId: string
  metadata?: Record<string, any>
  isPublic?: boolean
}

export type ImageProcessingOptions = {
  quality?: number
  width?: number
  height?: number
  format?: 'webp' | 'jpeg' | 'png'
  fit?: 'cover' | 'contain' | 'inside' | 'outside'
}

class ImageService {
  private static instance: ImageService
  private readonly SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  private readonly CACHE_DIR = '.image-cache'

  private constructor() {
    this.ensureCacheDir()
  }

  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService()
    }
    return ImageService.instance
  }

  private async ensureCacheDir() {
    try {
      await fs.mkdir(this.CACHE_DIR, { recursive: true })
    } catch (error) {
      console.error('Error creating cache directory:', error)
    }
  }

  private getCacheKey(filePath: string, options: any): string {
    const hash = createHash('md5')
    hash.update(filePath + JSON.stringify(options))
    return hash.digest('hex')
  }

  private async processImage(
    inputPath: string,
    options: ImageProcessingOptions = {}
  ): Promise<{ buffer: Buffer; metadata: sharp.OutputInfo }> {
    let pipeline = sharp(inputPath)
    const metadata = await pipeline.metadata()

    if (options.width || options.height) {
      const aspectRatio = metadata.width! / metadata.height!
      let targetWidth = options.width
      let targetHeight = options.height

      if (aspectRatio > 1 && targetWidth) {
        targetHeight = Math.round(targetWidth / aspectRatio)
      } else if (targetHeight) {
        targetWidth = Math.round(targetHeight * aspectRatio)
      }

      pipeline = pipeline.resize(targetWidth, targetHeight, {
        fit: options.fit || 'cover',
        withoutEnlargement: true
      })
    }

    if (options.format === 'webp') {
      pipeline = pipeline.webp({
        quality: options.quality || 80,
        effort: 4,
        nearLossless: true
      })
    } else if (options.format === 'jpeg') {
      pipeline = pipeline.jpeg({
        quality: options.quality || 80,
        progressive: true
      })
    } else if (options.format === 'png') {
      pipeline = pipeline.png({
        progressive: true,
        compressionLevel: 9
      })
    }

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })
    return { buffer: data, metadata: info }
  }

  async createImage(data: CreateImageInput): Promise<Image> {
    const image = await prisma.image.create({
      data: {
        name: data.name,
        path: data.path,
        size: data.size,
        width: data.width,
        height: data.height,
        hash: data.hash,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        isPublic: data.isPublic ?? false,
        folder: {
          connect: { id: data.folderId }
        }
      },
      include: {
        tags: true,
      },
    })

    // Generar thumbnail automáticamente
    await this.generateThumbnail(image.id, 'mid')

    // Inicializar estadísticas
    await statsService.getOrCreateImageStats(image.id)

    return image
  }

  async generateThumbnail(imageId: string, quality: ThumbnailQuality): Promise<void> {
    const image = await prisma.image.findUnique({
      where: { id: imageId }
    })

    if (!image) throw new Error('Imagen no encontrada')

    const config = THUMBNAIL_QUALITY_CONFIG[quality]
    if (!config) throw new Error('Calidad de thumbnail inválida')

    const cacheKey = this.getCacheKey(image.path, { ...config, type: 'thumbnail' })

    try {
      const { buffer, metadata } = await this.processImage(image.path, {
        width: config.width,
        height: config.height,
        quality: config.quality,
        format: 'webp',
        fit: 'cover'
      })

      await prisma.image.update({
        where: { id: imageId },
        data: {
          thumbnail: buffer,
          thumbnailSize: buffer.length,
          thumbnailWidth: metadata.width,
          thumbnailHeight: metadata.height,
          updatedAt: new Date()
        }
      })

      // Actualizar caché
      await thumbnailCache.set(cacheKey, buffer.toString('base64'))

    } catch (error) {
      console.error('Error generating thumbnail:', error)
      throw error
    }
  }

  async getThumbnail(imageId: string, quality: ThumbnailQuality = 'mid'): Promise<string> {
    const cacheKey = `thumbnail:${imageId}:${quality}`

    // Intentar obtener del caché
    const cached = await thumbnailCache.get(cacheKey)
    if (cached) return cached

    // Si no está en caché, generarlo
    await this.generateThumbnail(imageId, quality)

    // Intentar obtener el nuevo thumbnail
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { thumbnail: true }
    })

    if (!image?.thumbnail) {
      throw new Error('Error obteniendo thumbnail')
    }

    const base64 = (image.thumbnail as Buffer).toString('base64')
    await thumbnailCache.set(cacheKey, base64)

    return base64
  }

  // Resto de métodos del servicio original...
}

export const imageService = ImageService.getInstance()

