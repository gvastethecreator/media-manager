import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener todas las carpetas con sus imágenes
    const folders = await prisma.folder.findMany({
      include: {
        _count: {
          select: { images: true }
        },
        images: {
          select: {
            size: true
          }
        }
      }
    })

    // Calcular estadísticas totales
    const stats = {
      totalFolders: folders.length,
      totalFiles: folders.reduce((sum: any, folder: any) => sum + folder._count.images, 0),
      totalSize: folders.reduce((sum: any, folder: any) => {
        const folderSize = folder.images.reduce((total: any, img: any) => total + (img.size || 0), 0)
        return sum + folderSize
      }, 0),
      lastIndexed: folders
        .filter((f: any) => f.lastIndexed)
        .reduce((latest: any, folder: any) => {
          if (!latest || (folder.lastIndexed && folder.lastIndexed > latest)) {
            return folder.lastIndexed
          }
          return latest
        }, null as Date | null)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error en GET /api/folders/stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
