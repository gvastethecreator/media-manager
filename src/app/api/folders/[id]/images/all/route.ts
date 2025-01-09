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
  fileSystem?: {
    created?: string
    modified?: string
    size?: number
  }
  [key: string]: any
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params)
    const { id } = params

    if (!id) {
      imagesLogger.error('ID de carpeta no proporcionado')
      return NextResponse.json(
        { error: 'ID de carpeta no proporcionado' },
        { status: 400 }
      )
    }

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
      imagesLogger.error('Carpeta no encontrada:', id)
      return NextResponse.json(
        { error: 'Carpeta no encontrada', items: [] },
        { status: 404 }
      )
    }

    // Transformar los datos para mantener compatibilidad con la interfaz FileItem
    const items: FileItem[] = folder.images.map((image: any) => {
      let metadata: ImageMetadata = {}
      try {
        metadata = image.metadata ? JSON.parse(image.metadata) : {}
      } catch (e) {
        imagesLogger.warn('Error parsing metadata:', {
          imageId: image.id,
          error: e instanceof Error ? e.message : 'Error desconocido'
        })
      }

      return {
        id: image.id,
        name: image.name,
        path: image.path,
        type: 'image',
        size: Number(image.size),
        width: image.width || undefined,
        height: image.height || undefined,
        mimeType: metadata.mimeType,
        thumbnail: image.thumbnail ? `/api/images/${image.id}/thumbnail` : undefined,
        src: `/api/images/${image.id}`,
        isFavorite: image.isFavorite || false,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt,
        tags: image.tags?.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color
        })) || [],
        collections: image.collections?.map((collection: any) => ({
          id: collection.id,
          name: collection.name,
          emoji: collection.emoji,
          color: collection.color
        })) || [],
        stats: image.stats ? {
          views: image.stats.views,
          downloads: image.stats.downloads,
          lastViewed: image.stats.lastViewed
        } : undefined,
        metadata: {
          dimensions: image.width && image.height ? {
            width: image.width,
            height: image.height
          } : undefined,
          ...metadata
        },
        gridInfo: {
          displayMode: 'normal'
        }
      }
    })

    return NextResponse.json({
      success: true,
      items
    })
  } catch (error) {
    imagesLogger.error('Error obteniendo imágenes:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener las imágenes',
        message: error instanceof Error ? error.message : 'Error desconocido',
        items: []
      },
      { status: 500 }
    )
  }
}