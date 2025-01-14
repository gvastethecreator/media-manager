import { NextRequest, NextResponse } from 'next/server'
import { deleteFolder, getFolder, updateFolder } from '@/app/actions/folder.actions'
import { logger } from '@/lib/logger'

const routeLogger = logger.withContext('FolderRoute')

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    routeLogger.info('📁 GET /api/folders/[id]', params)
    const folder = await getFolder(params.id)
    return NextResponse.json(folder)
  } catch (error) {
    routeLogger.error('❌ Error en GET /api/folders/[id]:', error)
    return NextResponse.json(
      { error: 'Error al obtener la carpeta' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    routeLogger.info('📝 PUT /api/folders/[id]', params)
    const data = await request.json()
    const folder = await updateFolder(params.id, data)
    return NextResponse.json(folder)
  } catch (error) {
    routeLogger.error('❌ Error en PUT /api/folders/[id]:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la carpeta' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    routeLogger.info('🗑️ DELETE /api/folders/[id]', params)
    await deleteFolder(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    routeLogger.error('❌ Error en DELETE /api/folders/[id]:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la carpeta' },
      { status: 500 }
    )
  }
}
