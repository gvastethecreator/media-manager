import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { watcherServer } from '@/services/watcher'
import { logger } from '@/lib/logger'

const watchLogger = logger.withContext('WatchAPI')

/**
 * POST /api/folders/[id]/watch
 * Inicia o detiene la observación de una carpeta
 * @param {string} id - ID de la carpeta desde la URL
 * @body {boolean} watch - true para observar, false para dejar de observar
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { watch } = await req.json()
    const folderId = await Promise.resolve(params.id)

    if (!folderId) {
      watchLogger.error('ID de carpeta no proporcionado')
      return NextResponse.json(
        {
          success: false,
          error: 'ID de carpeta no proporcionado'
        },
        { status: 400 }
      )
    }

    // Buscar la carpeta
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    })

    if (!folder) {
      watchLogger.error('Carpeta no encontrada:', folderId)
      return NextResponse.json(
        {
          success: false,
          error: 'Carpeta no encontrada'
        },
        { status: 404 }
      )
    }

    // Actualizar estado de observación
    try {
      if (watch) {
        watchLogger.info('Iniciando observación de carpeta:', folder.path)
        await watcherServer.addPath(folder.path)
      } else {
        watchLogger.info('Deteniendo observación de carpeta:', folder.path)
        await watcherServer.removePath(folder.path)
      }

      // Actualizar en base de datos
      const updatedFolder = await prisma.folder.update({
        where: { id: folderId },
        data: { isWatched: watch }
      })

      watchLogger.info('Estado de observación actualizado:', {
        folderId,
        isWatched: watch
      })

      return NextResponse.json({
        success: true,
        data: {
          folderId,
          isWatched: watch,
          folder: updatedFolder
        }
      })
    } catch (watchError) {
      watchLogger.error('Error al gestionar watcher:', watchError)

      // Revertir cambios en BD si hubo error
      if (folder.isWatched !== watch) {
        await prisma.folder.update({
          where: { id: folderId },
          data: { isWatched: folder.isWatched }
        })
      }

      throw watchError
    }
  } catch (error) {
    watchLogger.error('Error al actualizar monitoreo:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar monitoreo'
      },
      { status: 500 }
    )
  }
}