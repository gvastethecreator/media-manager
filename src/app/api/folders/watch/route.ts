import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { watcherService } from '@/services/watcher.server'

export async function POST(request: Request) {
  try {
    const { folderId, watch } = await request.json()

    if (!folderId) {
      return NextResponse.json(
        { error: 'ID de carpeta no proporcionado' },
        { status: 400 }
      )
    }

    // Verificar que la carpeta existe
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    })

    if (!folder) {
      return NextResponse.json(
        { error: 'Carpeta no encontrada' },
        { status: 404 }
      )
    }

    if (watch) {
      await watcherService.watchFolder(folder.id)
    } else {
      await watcherService.stopWatching(folder.id)
    }

    // Actualizar el estado de monitoreo en la base de datos
    await prisma.folder.update({
      where: { id: folder.id },
      data: { isWatched: watch }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en POST /api/folders/watch:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
