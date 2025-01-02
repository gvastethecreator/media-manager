import { FileItem } from "@/types/files";
import { prisma } from '@/lib/prisma'

export async function getFiles(path?: string): Promise<FileItem[]> {
  const files = await prisma.image.findMany({
    where: {
      path: path ? {
        startsWith: path
      } : undefined
    },
    include: {
      tags: true,
      collections: true
    }
  })

  return files.map(mapImageToFileItem)
}

export async function getFilesByFolder(folderId: string): Promise<FileItem[]> {
  const files = await prisma.image.findMany({
    where: {
      folderId
    },
    include: {
      tags: true,
      collections: true
    }
  })

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
    },
    include: {
      tags: true,
      collections: true
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
    },
    include: {
      tags: true,
      collections: true
    }
  })

  return files.map(mapImageToFileItem)
}

export async function getFavorites(): Promise<FileItem[]> {
  const files = await prisma.image.findMany({
    where: {
      isFavorite: true
    },
    include: {
      tags: true,
      collections: true
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
    isFavorite: image.isFavorite || false,
    metadata: {
      dimensions: {
        width: image.width,
        height: image.height
      },
      orientation: image.width > image.height ? 'landscape' : 'portrait',
      created: image.createdAt,
      modified: image.updatedAt,
      tags: image.tags?.map(t => t.name) || []
    },
    gridInfo: {
      rowSpan: image.height > image.width * 1.5 ? 2 : 1,
      colSpan: image.width > image.height * 1.5 ? 2 : 1,
      priority: (image.width * image.height) / 1000000
    }
  }
}
