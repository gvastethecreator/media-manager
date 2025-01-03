import { FileItem } from "@/types/files";
import { prisma } from '@/lib/prisma'

function mapImageToFileItem(image: any): FileItem {
  let metadata = {};
  try {
    metadata = image.metadata ? JSON.parse(image.metadata) : {};
  } catch (e) {
    console.warn('Error parsing metadata:', e);
  }

  return {
    id: image.id,
    name: image.name,
    path: image.path,
    type: 'image',
    size: image.size,
    width: image.width,
    height: image.height,
    mimeType: metadata.mimeType,
    thumbnail: image.thumbnail ? `/api/images/${image.id}/thumbnail` : undefined,
    src: `/api/images/${image.id}`,
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
    isFavorite: image.isFavorite || false,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
    stats: image.stats ? {
      views: image.stats.views,
      downloads: image.stats.downloads,
      lastViewed: image.stats.lastViewed
    } : undefined
  }
}

export async function getFiles(path?: string): Promise<FileItem[]> {
  const files = await prisma.image.findMany({
    where: {
      path: path ? {
        startsWith: path
      } : undefined
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
    },
    orderBy: {
      createdAt: 'desc'
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
    },
    orderBy: {
      createdAt: 'desc'
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
    },
    orderBy: {
      createdAt: 'desc'
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
    },
    orderBy: {
      createdAt: 'desc'
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
