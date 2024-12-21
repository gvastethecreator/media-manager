'use server'

import { prisma } from '@/lib/prisma'
import { FileItem } from '@/types/files'

export async function getFiles(path?: string): Promise<FileItem[]> {
  const files = await prisma.image.findMany({
    where: {
      path: path ? {
        startsWith: path
      } : undefined
    }
  })

  return files.map(mapImageToFileItem)
}

export async function getFilesByFolder(folderId: string): Promise<FileItem[]> {
  console.log('Obteniendo archivos de la carpeta:', folderId)

  const files = await prisma.image.findMany({
    where: {
      folderId
    }
  })

  console.log('✅ Datos recibidos:', { count: files.length, sample: files.slice(0, 2) })

  return files.map(mapImageToFileItem)
}

export async function getCollectionFiles(collectionId: string): Promise<FileItem[]> {
  const files = await prisma.image.findMany({
    where: {
      collections: {
        some: {
          id: collectionId
        }
      }
    }
  })

  return files.map(mapImageToFileItem)
}

export async function getTaggedFiles(tag: string): Promise<FileItem[]> {
  const files = await prisma.image.findMany({
    where: {
      tags: {
        some: {
          name: tag
        }
      }
    }
  })

  return files.map(mapImageToFileItem)
}

function mapImageToFileItem(image: any): FileItem {
  return {
    id: image.id,
    name: image.name,
    type: 'image',
    size: image.size,
    path: image.path,
    url: `/api/images/${image.id}`,
    thumbnailUrl: `/api/thumbnails/${image.id}`,
    metadata: {
      dimensions: {
        width: image.width,
        height: image.height
      },
      orientation: image.width > image.height ? 'landscape' : 'portrait',
      created: image.createdAt,
      modified: image.updatedAt,
      tags: image.tags || []
    },
    gridInfo: {
      rowSpan: image.height > image.width * 1.5 ? 2 : 1,
      colSpan: image.width > image.height * 1.5 ? 2 : 1,
      priority: (image.width * image.height) / 1000000
    }
  }
}