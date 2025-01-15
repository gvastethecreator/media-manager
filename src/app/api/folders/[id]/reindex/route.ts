import { NextRequest, NextResponse } from 'next/server'
import { reindexFolder } from '@/app/actions/folder.actions'
import { logger } from '@/lib/logger'

const routeLogger = logger.withContext('FolderReindexRoute')

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    routeLogger.info('🔄 POST /api/folders/[id]/reindex', params)
    const result = await reindexFolder(params.id)
    return NextResponse.json(result)
  } catch (error) {
    routeLogger.error('❌ Error en POST /api/folders/[id]/reindex:', error)
    return NextResponse.json(
      { error: 'Error al reindexar la carpeta' },
      { status: 500 }
    )
  }
}