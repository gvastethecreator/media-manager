import { prisma } from './prisma'

export async function updateFolderStats(folderId: string) {
  const stats = await prisma.image.aggregate({
    where: { folderId },
    _count: { _all: true },
    _sum: { size: true }
  })

  await prisma.folder.update({
    where: { id: folderId },
    data: {
      totalFiles: stats._count._all,
      totalSize: stats._sum.size || 0,
      lastIndexed: new Date()
    }
  })
}

export async function getFolderStats(folderId: string) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: {
      totalFiles: true,
      totalSize: true,
      lastIndexed: true,
      _count: {
        select: { images: true }
      }
    }
  })

  return {
    totalFiles: folder?.totalFiles || 0,
    totalSize: folder?.totalSize || 0,
    lastIndexed: folder?.lastIndexed,
    imageCount: folder?._count.images || 0
  }
}

export async function updateAllFolderStats() {
  const folders = await prisma.folder.findMany({
    select: { id: true }
  })

  for (const folder of folders) {
    await updateFolderStats(folder.id)
  }
}
