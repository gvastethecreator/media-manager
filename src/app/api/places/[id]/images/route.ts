import { NextResponse } from 'next/server'
import { placeService } from '@/services/place.service'
import { logger } from '@/lib/logger'

const placeLogger = logger.withContext('PlacesAPI')

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    placeLogger.info(`📥 GET /api/places/${params.id}/images`)
    const images = await placeService.getPlaceImages(params.id)
    return NextResponse.json(images)
  } catch (error) {
    placeLogger.error(`❌ Error en GET /api/places/${params.id}/images:`, error)
    return NextResponse.json(
      { error: 'Error al obtener imágenes del lugar' },
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
    placeLogger.info(`📤 POST /api/places/${params.id}/images`, { imageId })
    const image = await placeService.addImageToPlace(params.id, imageId)
    return NextResponse.json(image)
  } catch (error) {
    placeLogger.error(`❌ Error en POST /api/places/${params.id}/images:`, error)
    return NextResponse.json(
      { error: 'Error al agregar imagen al lugar' },
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
    placeLogger.info(`🗑️ DELETE /api/places/${params.id}/images`, { imageId })
    const image = await placeService.removeImageFromPlace(params.id, imageId)
    return NextResponse.json({ success: true })
  } catch (error) {
    placeLogger.error(`❌ Error en DELETE /api/places/${params.id}/images:`, error)
    return NextResponse.json(
      { error: 'Error al eliminar imagen del lugar' },
      { status: 500 }
    )
  }
}