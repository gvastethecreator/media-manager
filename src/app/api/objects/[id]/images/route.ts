import { NextResponse } from 'next/server'
import { objectService } from '@/services/object.service'
import { logger } from '@/lib/logger'

const objectLogger = logger.withContext('ObjectsAPI')

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    objectLogger.info('📥 GET /api/objects/[id]/images', params.id)
    const images = await objectService.getObjectImages(params.id)
    return NextResponse.json(images)
  } catch (error) {
    objectLogger.error('❌ Error en GET /api/objects/[id]/images:', error)
    return NextResponse.json(
      { error: 'Error al obtener imágenes del objeto' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { imageId } = await request.json()
    objectLogger.info('📤 POST /api/objects/[id]/images', { objectId: params.id, imageId })
    await objectService.addImageToObject(params.id, imageId)
    return NextResponse.json({ success: true })
  } catch (error) {
    objectLogger.error('❌ Error en POST /api/objects/[id]/images:', error)
    return NextResponse.json(
      { error: 'Error al agregar imagen al objeto' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { imageId } = await request.json()
    objectLogger.info('🗑️ DELETE /api/objects/[id]/images', { objectId: params.id, imageId })
    await objectService.removeImageFromObject(params.id, imageId)
    return NextResponse.json({ success: true })
  } catch (error) {
    objectLogger.error('❌ Error en DELETE /api/objects/[id]/images:', error)
    return NextResponse.json(
      { error: 'Error al eliminar imagen del objeto' },
      { status: 500 }
    )
  }
}