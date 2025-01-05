import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { watcherServer } from '@/services/watcher'

/**
 * POST /api/folders/watch
 * Inicia o detiene la observación de una carpeta
 * @body {string} folderId - ID de la carpeta
 * @body {boolean} watch - true para observar, false para dejar de observar
 */
export async function POST(req: Request) {
  try {
    const { folderId, watch } = await req.json()

    // Validar datos
    if (!folderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere el ID de la carpeta'
        },
        { status: 400 }
      )
    }

    // Buscar la carpeta
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    })

    if (!folder) {
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
        await watcherServer.addPath(folder.path)
      } else {
        await watcherServer.removePath(folder.path)
      }

      // Actualizar en base de datos
      await prisma.folder.update({
        where: { id: folderId },
        data: { isWatched: watch }
      })

      return NextResponse.json({
        success: true,
        data: {
          folderId,
          isWatched: watch
        }
      })
    } catch (watchError) {
      console.error('❌ [API] Error al gestionar watcher:', watchError)

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
    console.error('❌ [API] Error al actualizar monitoreo:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar monitoreo'
      },
      { status: 500 }
    )
  }
}
