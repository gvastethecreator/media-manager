'use server'

import { prisma } from '@/lib/prisma'
import { imageService } from '@/services/image.service'
import { ThumbnailQuality } from '@/types/thumbnails'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createHash } from 'crypto'

const imageLogger = logger.withContext('ImageActions')

// Función auxiliar para generar hash temporal
function generateTemporaryHash(imageId: string, timestamp: number): string {
  const secret = process.env.NEXTAUTH_SECRET || 'your-secret-key'
  return createHash('sha256')
    .update(`${imageId}:${timestamp}:${secret}`)
    .digest('hex')
    .slice(0, 32)
}

export async function getImageUrl(imageId: string): Promise<string> {
  try {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { id: true }
    })

    if (!image) {
      throw new Error('Imagen no encontrada')
    }

    const timestamp = Date.now()
    const hash = generateTemporaryHash(imageId, timestamp)

    return `/api/images/temp/${imageId}/${timestamp}/${hash}`
  } catch (error) {
    imageLogger.error('Error generando URL de imagen', { imageId, error })
    throw new Error('Error al generar URL de imagen')
  }
}

export async function getOriginalImage(imageId: string): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: {
        path: true,
        metadata: true
      }
    })

    if (!image) {
      throw new Error('Imagen no encontrada')
    }

    const metadata = image.metadata ? JSON.parse(image.metadata) : {}
    const buffer = await imageService.getOriginalImage(imageId)

    return {
      buffer,
      mimeType: metadata.mimeType || 'image/jpeg'
    }
  } catch (error) {
    imageLogger.error('Error obteniendo imagen original', { imageId, error })
    throw new Error('Error al obtener la imagen original')
  }
}

export async function getThumbnail(imageId: string, quality: ThumbnailQuality = ThumbnailQuality.MEDIUM): Promise<string> {
  try {
    const thumbnail = await imageService.getThumbnail(imageId, quality)
    return thumbnail
  } catch (error) {
    imageLogger.error('Error obteniendo thumbnail', { imageId, quality, error })
    throw new Error('Error al obtener el thumbnail')
  }
}

export async function generateThumbnail(imageId: string, quality: ThumbnailQuality): Promise<void> {
  try {
    await imageService.generateThumbnail(imageId, quality)
    revalidatePath(`/api/thumbnails/${imageId}`)
  } catch (error) {
    imageLogger.error('Error generando thumbnail', { imageId, quality, error })
    throw new Error('Error al generar el thumbnail')
  }
}

export async function updateImageStats(imageId: string, type: 'view' | 'download'): Promise<void> {
  try {
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') ?? 'unknown'

    await prisma.imageStats.upsert({
      where: { imageId },
      create: {
        imageId,
        views: type === 'view' ? 1 : 0,
        downloads: type === 'download' ? 1 : 0,
        lastViewed: new Date()
      },
      update: {
        views: type === 'view' ? { increment: 1 } : undefined,
        downloads: type === 'download' ? { increment: 1 } : undefined,
        lastViewed: new Date()
      }
    })

    await prisma.activity.create({
      data: {
        type: type === 'view' ? 'IMAGE_VIEW' : 'IMAGE_DOWNLOAD',
        description: `Image ${type === 'view' ? 'viewed' : 'downloaded'} from ${userAgent}`,
        imageId
      }
    })

    revalidatePath(`/api/stats/${imageId}`)
  } catch (error) {
    imageLogger.error('Error actualizando estadísticas', { imageId, type, error })
  }
}