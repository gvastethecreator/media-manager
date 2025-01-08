import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import type { ThumbnailResult } from './thumbnail'

interface OptimizeImageOptions {
  quality?: number
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

interface GenerateThumbnailOptions {
  width: number
  height: number
  quality?: number
}

export class ImageOptimizer {
  private cacheDir: string

  constructor(cacheDir = '.image-cache') {
    this.cacheDir = cacheDir
    this.ensureCacheDir()
  }

  private async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
    } catch (error) {
      console.error('Error creating cache directory:', error)
    }
  }

  private getCacheKey(filePath: string, options: any): string {
    const hash = createHash('md5')
    hash.update(filePath + JSON.stringify(options))
    return hash.digest('hex')
  }

  private getCachePath(cacheKey: string): string {
    return path.join(this.cacheDir, `${cacheKey}.webp`)
  }

  async optimizeImage(
    inputPath: string,
    options: OptimizeImageOptions = {}
  ): Promise<{ buffer: Buffer; metadata: sharp.OutputInfo }> {
    const cacheKey = this.getCacheKey(inputPath, options)
    const cachePath = this.getCachePath(cacheKey)

    try {
      // Intentar usar versión cacheada
      const stats = await fs.stat(cachePath)
      if (stats.isFile()) {
        const buffer = await fs.readFile(cachePath)
        const { info } = await sharp(buffer).toBuffer({ resolveWithObject: true })
        return { buffer, metadata: info }
      }
    } catch (error) {
      // Cache miss, continuar con la optimización
    }

    let pipeline = sharp(inputPath)

    if (options.width || options.height) {
      pipeline = pipeline.resize(options.width, options.height, {
        fit: options.fit || 'cover',
        withoutEnlargement: true
      })
    }

    pipeline = pipeline.webp({
      quality: options.quality || 80,
      effort: 4
    })

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })

    // Guardar en caché
    await fs.writeFile(cachePath, data)

    return { buffer: data, metadata: info }
  }

  async generateThumbnail(
    inputPath: string,
    options: GenerateThumbnailOptions
  ): Promise<ThumbnailResult> {
    const cacheKey = this.getCacheKey(inputPath, { ...options, type: 'thumbnail' })
    const cachePath = this.getCachePath(cacheKey)

    try {
      // Intentar usar versión cacheada
      const stats = await fs.stat(cachePath)
      if (stats.isFile()) {
        const buffer = await fs.readFile(cachePath)
        const { info } = await sharp(buffer).toBuffer({ resolveWithObject: true })
        return {
          buffer,
          width: info.width || options.width,
          height: info.height || options.height,
          format: 'webp',
          size: buffer.length
        }
      }
    } catch (error) {
      // Cache miss, continuar con la generación
    }

    const { buffer: data, metadata: info } = await this.optimizeImage(inputPath, {
      width: options.width,
      height: options.height,
      quality: options.quality || 60,
      fit: 'cover'
    })

    // Guardar en caché
    await fs.writeFile(cachePath, data)

    return {
      buffer: data,
      width: info.width || options.width,
      height: info.height || options.height,
      format: 'webp',
      size: data.length
    }
  }

  async getImageMetadata(inputPath: string): Promise<sharp.Metadata> {
    return await sharp(inputPath).metadata()
  }

  async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir)
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.cacheDir, file)))
      )
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }
}