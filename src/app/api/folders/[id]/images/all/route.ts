import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { FileItem } from '@/types/file-item'
import { logger } from '@/lib/logger'

const imagesLogger = logger.withContext('ImagesAPI')

interface ImageMetadata {
  mimeType?: string
  dimensions?: {
    width: number
    height: number
  }
  fileSystem: {
    size: number
    created: string
    modified: string
    accessed: string
  }
  extension?: string
  exif?: Record<string, any>
  generation?: Record<string, any>
  [key: string]: any
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  let folderId: string | null = null

  try {
    const { id } = await params
    folderId = id

    if (!id) {
      imagesLogger.error('🚫 ID de carpeta no proporcionado')
      return NextResponse.json(
        {
          error: 'ID de carpeta no proporcionado',
          details: 'Se requiere un ID de carpeta válido',
          items: []
        },
        { status: 400 }
      )
    }

    imagesLogger.info('🔍 Buscando carpeta:', { id })

    // Obtener la carpeta con sus imágenes
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
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
                emoji: true,
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
        }
      }
    })

    if (!folder) {
      imagesLogger.error('❌ Carpeta no encontrada:', {
        id,
        error: 'La carpeta no existe en la base de datos'
      })
      return NextResponse.json(
        {
          error: 'Carpeta no encontrada',
          details: 'La carpeta solicitada no existe en la base de datos',
          items: []
        },
        { status: 404 }
      )
    }

    imagesLogger.info('✅ Carpeta encontrada:', {
      id: folder.id,
      name: folder.name,
      imageCount: folder.images.length
    })

    // Transformar los datos para mantener compatibilidad con la interfaz FileItem
    const items: FileItem[] = folder.images.map((image: any) => {
      let metadata: ImageMetadata = {
        fileSystem: {
          size: Number(image.size),
          created: image.createdAt.toISOString(),
          modified: image.updatedAt.toISOString(),
          accessed: image.updatedAt.toISOString()
        }
      }

      try {
        const parsedMetadata = image.metadata ? JSON.parse(image.metadata) : {}
        metadata = {
          ...parsedMetadata,
          fileSystem: metadata.fileSystem // Mantener el fileSystem ya definido
        }
      } catch (e) {
        imagesLogger.warn('⚠️ Error al procesar metadata:', {
          imageId: image.id,
          error: e instanceof Error ? e.message : 'Error desconocido'
        })
      }

      // Construir la URL del thumbnail usando el nuevo formato
      const thumbnailUrl = image.thumbnail
        ? `/api/thumbnails/${image.id}?quality=medium`
        : undefined

      return {
        id: image.id,
        name: image.name,
        path: image.path,
        type: 'image',
        size: Number(image.size),
        width: image.width || 0,
        height: image.height || 0,
        mimeType: metadata.mimeType,
        thumbnail: thumbnailUrl,
        thumbnailSize: image.thumbnailSize,
        thumbnailWidth: image.thumbnailWidth,
        thumbnailHeight: image.thumbnailHeight,
        src: `/api/images/${image.id}/preview`,
        isFavorite: image.isFavorite || false,
        isPublic: image.isPublic || false,
        createdAt: image.createdAt.toISOString(),
        updatedAt: image.updatedAt.toISOString(),
        folderId: folder.id,
        metadata: {
          mimeType: metadata.mimeType,
          size: Number(image.size),
          dimensions: image.width && image.height ? {
            width: image.width,
            height: image.height
          } : undefined,
          fileSystem: metadata.fileSystem,
          extension: metadata.extension,
          exif: metadata.exif,
          generation: metadata.generation
        },
        collections: image.collections?.map((collection: any) => ({
          id: collection.id,
          name: collection.name,
          emoji: collection.emoji,
          color: collection.color
        })) || [],
        tags: image.tags?.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color
        })) || [],
        albums: [], // Arrays vacíos para las relaciones opcionales
        characters: [],
        places: [],
        objects: [],
        activities: [],
        stats: image.stats ? {
          views: image.stats.views,
          downloads: image.stats.downloads,
          lastViewed: image.stats.lastViewed.toISOString()
        } : undefined,
        gridInfo: {
          displayMode: 'normal'
        }
      }
    })

    const responseTime = Date.now() - startTime
    imagesLogger.info('✨ Respuesta generada:', {
      folderId: id,
      folderName: folder.name,
      itemCount: items.length,
      responseTimeMs: responseTime,
      firstImageId: items[0]?.id
    })

    return NextResponse.json({
      items,
      folder: {
        id: folder.id,
        name: folder.name,
        path: folder.path,
        totalFiles: folder.totalFiles,
        totalSize: folder.totalSize
      },
      meta: {
        responseTimeMs: responseTime,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    imagesLogger.error('❌ Error al procesar solicitud:', {
      folderId,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      responseTimeMs: responseTime
    })

    return NextResponse.json(
      {
        error: 'Error al obtener las imágenes',
        details: error instanceof Error ? error.message : 'Error interno del servidor',
        meta: {
          responseTimeMs: responseTime,
          timestamp: new Date().toISOString()
        },
        items: []
      },
      { status: 500 }
    )
  }
}