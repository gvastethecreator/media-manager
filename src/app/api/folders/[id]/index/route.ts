import { NextRequest, NextResponse } from 'next/server'
import { indexFolder } from '@/app/actions/folder.actions'
import { logger } from '@/lib/logger'

const routeLogger = logger.withContext('FolderIndexRoute')

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    routeLogger.info('🔄 POST /api/folders/[id]/index', params)
    const result = await indexFolder(params.id)
    return NextResponse.json(result)
  } catch (error) {
    routeLogger.error('❌ Error en POST /api/folders/[id]/index:', error)
    return NextResponse.json(
      { error: 'Error al indexar la carpeta' },
      { status: 500 }
    )
  }
}
