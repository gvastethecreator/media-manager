'use server'

import { prisma } from '@/lib/prisma'
import type { Image } from '@prisma/client'
import { imageService } from '@/services/image.service'
import { ThumbnailQuality } from '@/types/thumbnails'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import sharp from 'sharp'
import fs from 'fs/promises'
import { thumbnailCache } from '@/lib/cache'
import { existsSync } from 'fs'
import path from 'path'
import { statsEventEmitter, STATS_EVENTS } from '@/services/stats.service'
import { FileMetadata } from "@/types/file-item";
import * as exifr from "exifr";
import { promisify } from "util";
import { readFile } from "fs/promises";

const imageLogger = logger.withContext('ImageActions')

export async function getImageUrl(imageId: string): Promise<string> {
  try {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { path: true },
    });

    if (!image) {
      throw new Error("Imagen no encontrada");
    }

    // Generar URL para el endpoint de imágenes
    const imageUrl = `/api/images/${imageId}/content`;
    return imageUrl;
  } catch (error) {
    imageLogger.error("Error getting image URL:", error);
    throw new Error("No se pudo obtener la URL de la imagen");
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
    const stats = await prisma.imageStats.findUnique({
      where: { imageId },
    });

    if (stats) {
      await prisma.imageStats.update({
        where: { imageId },
        data: {
          views: type === 'view' ? stats.views + 1 : stats.views,
          downloads: type === 'download' ? stats.downloads + 1 : stats.downloads,
          lastViewed: new Date(),
        },
      });
    } else {
      await prisma.imageStats.create({
        data: {
          imageId,
          views: type === 'view' ? 1 : 0,
          downloads: type === 'download' ? 1 : 0,
        },
      });
    }

    revalidatePath("/");
  } catch (error) {
    imageLogger.error("Error updating image stats:", error);
    throw new Error("No se pudo actualizar las estadísticas de la imagen");
  }
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

export async function createImage(data: CreateImageInput) {
  try {
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
    await generateThumbnail(image.id, ThumbnailQuality.MEDIUM)

    // Inicializar estadísticas
    await prisma.imageStats.create({
      data: {
        imageId: image.id,
        views: 0,
        downloads: 0,
        lastViewed: new Date()
      }
    })

    // Registrar actividad
    await prisma.activity.create({
      data: {
        type: 'IMAGE_CREATE',
        description: `Image ${image.name} created`,
        imageId: image.id
      }
    })

    // Emitir eventos
    statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE)

    revalidatePath('/api/images')
    revalidatePath(`/api/folders/${data.folderId}`)

    return image
  } catch (error) {
    imageLogger.error('Error creating image:', { error, data })
    throw new Error('Error al crear la imagen')
  }
}

export type ImageProcessingOptions = {
  quality?: number
  width?: number
  height?: number
  format?: 'webp' | 'jpeg' | 'png'
  fit?: 'cover' | 'contain' | 'inside' | 'outside'
}

export async function processImage(
  imageId: string,
  options: ImageProcessingOptions = {}
): Promise<Buffer> {
  try {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { path: true }
    })

    if (!image) {
      throw new Error('Imagen no encontrada')
    }

    let pipeline = sharp(image.path)
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

    const { data } = await pipeline.toBuffer({ resolveWithObject: true })
    return data
  } catch (error) {
    imageLogger.error('Error processing image:', { imageId, options, error })
    throw new Error('Error al procesar la imagen')
  }
}

export async function optimizeThumbnail(imageId: string): Promise<void> {
  try {
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { thumbnail: true }
    })

    if (!image?.thumbnail) {
      throw new Error('Thumbnail no encontrado')
    }

    // Optimizar el thumbnail existente
    const optimizedBuffer = await sharp(image.thumbnail)
      .webp({
        quality: 80,
        effort: 6,
        nearLossless: true,
        smartSubsample: true
      })
      .toBuffer()

    // Actualizar el thumbnail en la base de datos
    await prisma.image.update({
      where: { id: imageId },
      data: {
        thumbnail: optimizedBuffer,
        thumbnailSize: optimizedBuffer.length,
        thumbnailOptimizedAt: new Date()
      }
    })

    // Limpiar caché
    const cacheKeys = Object.values(ThumbnailQuality).map(
      quality => `thumbnail:${imageId}:${quality}`
    )
    await Promise.all(cacheKeys.map(key => thumbnailCache.delete(key)))

    revalidatePath(`/api/thumbnails/${imageId}`)
  } catch (error) {
    imageLogger.error('Error optimizando thumbnail:', { imageId, error })
    throw new Error('Error al optimizar el thumbnail')
  }
}

export async function cleanupThumbnails(): Promise<{
  cleaned: number
  errors: number
  totalSize: number
}> {
  try {
    const images = await prisma.image.findMany({
      where: {
        thumbnail: { not: null }
      },
      select: {
        id: true,
        thumbnail: true,
        thumbnailSize: true,
        path: true
      }
    })

    let cleaned = 0
    let errors = 0
    let totalSize = 0

    for (const image of images) {
      try {
        // Verificar si el archivo original existe
        try {
          await fs.access(image.path)
        } catch {
          // Si el archivo original no existe, eliminar el thumbnail
          await prisma.image.update({
            where: { id: image.id },
            data: {
              thumbnail: null,
              thumbnailSize: null,
              thumbnailWidth: null,
              thumbnailHeight: null,
              thumbnailError: 'Archivo original no encontrado',
              thumbnailErrorAt: new Date()
            }
          })
          cleaned++
          totalSize += image.thumbnailSize || 0
          continue
        }

        // Verificar integridad del thumbnail
        if (image.thumbnail) {
          try {
            await sharp(image.thumbnail).metadata()
          } catch {
            // Si el thumbnail está corrupto, regenerarlo
            await generateThumbnail(image.id, ThumbnailQuality.MEDIUM)
            cleaned++
            totalSize += image.thumbnailSize || 0
          }
        }
      } catch (error) {
        errors++
        imageLogger.error('Error limpiando thumbnail:', { imageId: image.id, error })
      }
    }

    // Registrar actividad
    await prisma.activity.create({
      data: {
        type: 'THUMBNAILS_CLEANUP',
        description: `Cleaned ${cleaned} thumbnails, ${errors} errors, freed ${totalSize} bytes`
      }
    })

    return { cleaned, errors, totalSize }
  } catch (error) {
    imageLogger.error('Error en limpieza de thumbnails:', { error })
    throw new Error('Error en la limpieza de thumbnails')
  }
}

export type GetImagesOptions = {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  folderId?: string
  tagIds?: string[]
  collectionIds?: string[]
  isFavorite?: boolean
  isPublic?: boolean
  search?: string
}

export type GetImagesResult = {
  images: any[]
  total: number
  page: number
  pageSize: number
}

export async function getImages(options: GetImagesOptions = {}): Promise<GetImagesResult> {
  try {
    const {
      page = 0,
      pageSize = 100,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      folderId,
      tagIds,
      collectionIds,
      isFavorite,
      isPublic,
      search
    } = options

    // Construir el where
    const where: any = {}

    if (folderId) {
      where.folderId = folderId
    }

    if (tagIds?.length) {
      where.tags = {
        some: {
          id: {
            in: tagIds
          }
        }
      }
    }

    if (collectionIds?.length) {
      where.collections = {
        some: {
          id: {
            in: collectionIds
          }
        }
      }
    }

    if (isFavorite !== undefined) {
      where.isFavorite = isFavorite
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { path: { contains: search } }
      ]
    }

    // Obtener el total de imágenes
    const total = await prisma.image.count({ where })

    // Obtener las imágenes paginadas
    const images = await prisma.image.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            path: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        collections: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        stats: {
          select: {
            views: true,
            downloads: true,
            lastViewed: true
          }
        }
      }
    })

    return {
      images,
      total,
      page,
      pageSize
    }
  } catch (error) {
    imageLogger.error('Error obteniendo imágenes:', { error, options })
    throw new Error('Error al obtener las imágenes')
  }
}

export async function getThumbnailStats(): Promise<{
  total: number
  withThumbnail: number
  withError: number
  optimized: number
  averageSize: number
}> {
  try {
    const total = await prisma.image.count()
    const withThumbnail = await prisma.image.count({
      where: { thumbnail: { not: null } }
    })
    const withError = await prisma.image.count({
      where: { thumbnailError: { not: null } }
    })
    const optimized = await prisma.image.count({
      where: { thumbnailOptimizedAt: { not: null } }
    })
    const avgResult = await prisma.image.aggregate({
      _avg: { thumbnailSize: true },
      where: { thumbnail: { not: null } }
    })

    return {
      total,
      withThumbnail,
      withError,
      optimized,
      averageSize: Math.round(avgResult._avg.thumbnailSize || 0)
    }
  } catch (error) {
    imageLogger.error('Error obteniendo estadísticas de thumbnails:', { error })
    throw new Error('Error al obtener estadísticas de thumbnails')
  }
}

export async function reprocessThumbnails(options: {
  force?: boolean
  quality?: ThumbnailQuality
} = {}): Promise<{
  processed: number
  errors: number
  totalTime: number
}> {
  const startTime = Date.now()
  let processed = 0
  let errors = 0

  try {
    const where = options.force
      ? {}
      : {
        OR: [
          { thumbnail: null },
          { thumbnailError: { not: null } }
        ]
      }

    const images = await prisma.image.findMany({
      where,
      select: { id: true }
    })

    for (const image of images) {
      try {
        await generateThumbnail(image.id, options.quality || ThumbnailQuality.MEDIUM)
        processed++
      } catch (error) {
        errors++
        imageLogger.error('Error reprocesando thumbnail:', { imageId: image.id, error })
      }
    }

    // Registrar actividad
    await prisma.activity.create({
      data: {
        type: 'THUMBNAILS_REPROCESS',
        description: `Reprocessed ${processed} thumbnails, ${errors} errors, took ${Date.now() - startTime}ms`
      }
    })

    return {
      processed,
      errors,
      totalTime: Date.now() - startTime
    }
  } catch (error) {
    imageLogger.error('Error en reprocesamiento de thumbnails:', { error })
    throw new Error('Error en reprocesamiento de thumbnails')
  }
}

export async function updateImage(id: string, data: Partial<Image>): Promise<Image> {
  try {
    const updatedImage = await prisma.image.update({
      where: { id },
      data,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            path: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        collections: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        stats: {
          select: {
            views: true,
            downloads: true,
            lastViewed: true
          }
        }
      }
    })

    // Registrar actividad
    await prisma.activity.create({
      data: {
        type: 'IMAGE_UPDATE',
        description: `Image ${updatedImage.name} updated`,
        imageId: id
      }
    })

    // Emitir eventos
    statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE)

    revalidatePath(`/api/images/${id}`)
    return updatedImage
  } catch (error) {
    imageLogger.error('Error updating image:', { id, data, error })
    throw new Error('Error al actualizar la imagen')
  }
}

export async function updateFavoriteStatus(id: string, isFavorite: boolean): Promise<Pick<Image, 'id' | 'name' | 'isFavorite'>> {
  try {
    const updatedImage = await prisma.image.update({
      where: { id },
      data: { isFavorite },
      select: {
        id: true,
        name: true,
        isFavorite: true,
      }
    })

    // Registrar actividad
    await prisma.activity.create({
      data: {
        type: isFavorite ? 'IMAGE_FAVORITE' : 'IMAGE_UNFAVORITE',
        description: `Image ${updatedImage.name} ${isFavorite ? 'marked as favorite' : 'removed from favorites'}`,
        imageId: id
      }
    })

    // Emitir eventos
    statsEventEmitter.emit(STATS_EVENTS.FILES_CHANGE)
    statsEventEmitter.emit(STATS_EVENTS.FAVORITE_CHANGE)

    revalidatePath('/api/images/favorites')
    revalidatePath(`/api/images/${id}`)
    return updatedImage
  } catch (error) {
    imageLogger.error('Error updating favorite status:', { id, isFavorite, error })
    throw new Error('Error al actualizar estado de favorito')
  }
}

export async function getFavoriteImages(): Promise<Image[]> {
  try {
    const images = await prisma.image.findMany({
      where: {
        isFavorite: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            path: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        collections: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        stats: {
          select: {
            views: true,
            downloads: true,
            lastViewed: true
          }
        }
      }
    })

    return images
  } catch (error) {
    imageLogger.error('Error getting favorite images:', error)
    throw new Error('Error al obtener imágenes favoritas')
  }
}

export async function getImage(id: string): Promise<Image | null> {
  try {
    const image = await prisma.image.findUnique({
      where: { id },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            path: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        collections: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        stats: {
          select: {
            views: true,
            downloads: true,
            lastViewed: true
          }
        }
      }
    })

    if (!image) {
      return null
    }

    // Verificar que el archivo existe
    if (!existsSync(image.path)) {
      await prisma.image.update({
        where: { id },
        data: {
          thumbnailError: 'Archivo original no encontrado',
          thumbnailErrorAt: new Date()
        }
      })
      return null
    }

    return image
  } catch (error) {
    imageLogger.error('Error getting image:', { id, error })
    throw new Error('Error al obtener la imagen')
  }
}

// Funciones auxiliares para parseo de metadata AI
function parseA1111Format(text: string): any {
  try {
    // Buscar patrones de A1111
    const promptRegex = /^([^:]+)$/m;
    const negativeRegex = /^Negative prompt: (.+)$/m;
    const settingsRegex = /^Steps: (\d+), Sampler: ([^,]+), CFG scale: (\d+), Seed: (-?\d+)/;

    const promptMatch = text.match(promptRegex);
    const negativeMatch = text.match(negativeRegex);
    const settingsMatch = text.match(settingsRegex);

    return {
      type: "stable-diffusion-webui",
      prompt: promptMatch?.[1]?.trim(),
      negative_prompt: negativeMatch?.[1]?.trim(),
      steps: settingsMatch?.[1] ? parseInt(settingsMatch[1]) : undefined,
      sampler: settingsMatch?.[2]?.trim(),
      cfg_scale: settingsMatch?.[3] ? parseFloat(settingsMatch[3]) : undefined,
      seed: settingsMatch?.[4] ? parseInt(settingsMatch[4]) : undefined
    };
  } catch (error) {
    return null;
  }
}

function parseInvokeAIFormat(data: any): any {
  try {
    return {
      type: "invokeai",
      prompt: data.prompt,
      negative_prompt: data.negative_prompt,
      steps: data.steps,
      sampler: data.sampler,
      cfg_scale: data.cfg_scale,
      seed: data.seed,
      model: data.model,
      scheduler: data.scheduler
    };
  } catch (error) {
    return null;
  }
}

function parseNovelAIFormat(data: any): any {
  try {
    return {
      type: "novelai",
      prompt: data.prompt,
      negative_prompt: data.uc || data.negative_prompt,
      steps: data.steps,
      sampler: data.sampler,
      cfg_scale: data.scale,
      seed: data.seed,
      model: data.model
    };
  } catch (error) {
    return null;
  }
}

export async function extractImageMetadata(
  imagePath: string
): Promise<FileMetadata> {
  try {
    const metadata: FileMetadata = {};
    const buffer = await readFile(imagePath);

    // 1. Extraer información básica con Sharp
    const imageInfo = await sharp(buffer).metadata();
    metadata.mimeType = `image/${imageInfo.format}`;
    metadata.dimensions = {
      width: imageInfo.width || 0,
      height: imageInfo.height || 0,
    };
    metadata.colorSpace = imageInfo.space;
    metadata.hasAlpha = imageInfo.hasAlpha;
    metadata.isAnimated = imageInfo.pages ? imageInfo.pages > 1 : false;

    // 2. Extraer metadata completa con exifr
    try {
      const exifData = await exifr.parse(buffer, {
        tiff: true,
        xmp: true,
        icc: true,
        iptc: true,
        jfif: true,
        ihdr: true,
        png: true,
        userComment: true
      }) as any;

      if (exifData) {
        metadata.exif = {
          make: exifData.make || exifData.Make,
          model: exifData.model || exifData.Model,
          software: exifData.software || exifData.Software,
          dateTime: exifData.dateTimeOriginal || exifData.DateTimeOriginal ||
            exifData.createDate || exifData.CreateDate ||
            exifData.modifyDate || exifData.ModifyDate,
          exposureTime: exifData.exposureTime || exifData.ExposureTime,
          fNumber: exifData.fNumber || exifData.FNumber,
          iso: exifData.iso || exifData.ISO,
          focalLength: exifData.focalLength || exifData.FocalLength,
          lens: exifData.lensModel || exifData.LensModel,
          copyright: exifData.copyright || exifData.Copyright,
          artist: exifData.artist || exifData.Artist,
          description: exifData.imageDescription || exifData.ImageDescription,
          gps: exifData.latitude && exifData.longitude ? {
            latitude: exifData.latitude,
            longitude: exifData.longitude,
            altitude: exifData.altitude
          } : undefined
        };

        // Extraer XMP si existe
        if (exifData.xmp) {
          metadata.xmp = {
            title: exifData.xmp.title,
            creator: exifData.xmp.creator,
            rights: exifData.xmp.rights,
            subject: Array.isArray(exifData.xmp.subject) ? exifData.xmp.subject : [],
            rating: typeof exifData.xmp.rating === 'number' ? exifData.xmp.rating : undefined
          };
        }

        // Extraer IPTC si existe
        if (exifData.iptc) {
          metadata.iptc = {
            headline: exifData.iptc.headline || exifData.iptc.Headline,
            caption: exifData.iptc.caption || exifData.iptc.Caption,
            keywords: Array.isArray(exifData.iptc.keywords) ? exifData.iptc.keywords :
              Array.isArray(exifData.iptc.Keywords) ? exifData.iptc.Keywords : [],
            copyright: exifData.iptc.copyright || exifData.iptc.CopyrightNotice,
            source: exifData.iptc.source || exifData.iptc.Source
          };
        }

        // Intentar extraer metadata de PNG si existe
        if (exifData.parameters || exifData.userComment) {
          const pngText = exifData.parameters || exifData.userComment;
          const aiMetadata = parseA1111Format(pngText);
          if (aiMetadata) {
            metadata.generation = aiMetadata;
          }
        }
      }
    } catch (error) {
      imageLogger.warn("No EXIF/XMP/IPTC data found:", error);
    }

    // 3. Intentar extraer metadata de generación AI
    try {
      const filename = path.basename(imagePath);
      let aiMetadata = null;

      // Intentar extraer de PNG chunks (tEXt)
      const pngInfo = await exifr.parse(buffer, { tEXt: true });
      if (pngInfo?.parameters) {
        aiMetadata = parseA1111Format(pngInfo.parameters);
      }

      // Si no hay metadata en PNG chunks, intentar desde el nombre
      if (!aiMetadata) {
        // Stable Diffusion WebUI format
        const sdMatch = filename.match(/(\{.*\})/);
        if (sdMatch) {
          const genData = JSON.parse(sdMatch[1]);
          aiMetadata = {
            type: "stable-diffusion",
            prompt: genData.prompt,
            negative_prompt: genData.negative_prompt,
            model: genData.model,
            steps: genData.steps,
            cfg_scale: genData.cfg_scale,
            seed: genData.seed,
            sampler: genData.sampler,
            scheduler: genData.scheduler,
            clip_skip: genData.clip_skip,
            extra_params: genData.extra_params
          };
        }

        // ComfyUI format
        const comfyMatch = filename.match(/_\[(.*?)\]_/);
        if (comfyMatch) {
          const comfyData = JSON.parse(comfyMatch[1]);
          aiMetadata = {
            type: "comfyui",
            workflow: comfyData.workflow,
            prompt: comfyData.prompt,
            negative_prompt: comfyData.negative_prompt,
            model: comfyData.model,
            steps: comfyData.steps,
            cfg: comfyData.cfg,
            seed: comfyData.seed,
            scheduler: comfyData.scheduler,
            extra_params: comfyData.extra_params
          };
        }

        // InvokeAI format
        const invokeMatch = filename.match(/_invokeai\[(.*?)\]_/);
        if (invokeMatch) {
          const invokeData = JSON.parse(invokeMatch[1]);
          aiMetadata = parseInvokeAIFormat(invokeData);
        }

        // NovelAI format
        const novelaiMatch = filename.match(/_novelai\[(.*?)\]_/);
        if (novelaiMatch) {
          const novelaiData = JSON.parse(novelaiMatch[1]);
          aiMetadata = parseNovelAIFormat(novelaiData);
        }
      }

      if (aiMetadata) {
        metadata.generation = aiMetadata;
      }

    } catch (error) {
      imageLogger.warn("No AI generation metadata found:", error);
    }

    return metadata;
  } catch (error) {
    imageLogger.error("Error extracting metadata:", error);
    throw new Error("No se pudo extraer la metadata de la imagen");
  }
}

export async function updateImageMetadata(
  imageId: string,
  metadata: FileMetadata
): Promise<void> {
  try {
    await prisma.image.update({
      where: { id: imageId },
      data: {
        metadata: JSON.stringify(metadata),
      },
    });

    revalidatePath("/");
  } catch (error) {
    imageLogger.error("Error updating metadata:", error);
    throw new Error("No se pudo actualizar la metadata de la imagen");
  }
}