import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { generateThumbnail } from '@/lib/thumbnail'
import { ThumbnailQuality } from '@/services/thumbnail.service'

const thumbLogger = logger.withContext('ThumbnailAPI')

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Obtener y validar el ID
    const params = await Promise.resolve(context.params)
    const { id } = params

    if (!id) {
      thumbLogger.error('❌ ID no proporcionado')
      return NextResponse.json(
        { error: 'ID de imagen requerido' },
        { status: 400 }
      )
    }

    thumbLogger.info('🔍 Thumbnail request for ID:', id)

    // Obtener la imagen
    const file = await prisma.image.findUnique({
      where: { id },
      select: {
        id: true,
        path: true,
        thumbnail: true,
        thumbnailError: true,
        thumbnailErrorAt: true
      }
    })

    if (!file) {
      thumbLogger.error('❌ Imagen no encontrada:', id)
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      )
    }

    // Log para debugging
    thumbLogger.debug('📄 Image found:', {
      id: file.id,
      path: file.path,
      hasThumbnail: !!file.thumbnail,
      hasError: !!file.thumbnailError
    })

    // Si ya tiene thumbnail, devolverlo
    if (file.thumbnail) {
      thumbLogger.info('✅ Returning existing thumbnail')
      const headers = new Headers()
      headers.set('Content-Type', 'image/webp')
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      headers.set('ETag', `"${id}"`)

      return new NextResponse(file.thumbnail, {
        headers,
        status: 200
      })
    }

    // Obtener calidad de la URL
    const { searchParams } = new URL(request.url)
    const quality = (searchParams.get('quality') || 'mid') as ThumbnailQuality

    // Si no tiene thumbnail, generarlo
    try {
      const thumbnail = await generateThumbnail(file.path, { quality })

      if (!thumbnail || !thumbnail.buffer) {
        throw new Error('No se pudo generar el thumbnail')
      }

      // Actualizar la imagen con el nuevo thumbnail
      await prisma.image.update({
        where: { id },
        data: {
          thumbnail: thumbnail.buffer,
          thumbnailSize: thumbnail.buffer.length,
          thumbnailWidth: thumbnail.width,
          thumbnailHeight: thumbnail.height,
          thumbnailError: null,
          thumbnailErrorAt: null,
          updatedAt: new Date()
        }
      })

      thumbLogger.info('✅ New thumbnail generated and stored')
      const headers = new Headers()
      headers.set('Content-Type', 'image/webp')
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      headers.set('ETag', `"${id}-${Date.now()}"`)

      return new NextResponse(thumbnail.buffer, {
        headers,
        status: 200
      })
    } catch (error) {
      // Registrar el error en la base de datos
      await prisma.image.update({
        where: { id },
        data: {
          thumbnailError: error instanceof Error ? error.message : 'Error desconocido',
          thumbnailErrorAt: new Date(),
          thumbnail: null,
          thumbnailSize: null,
          thumbnailWidth: null,
          thumbnailHeight: null
        }
      })

      thumbLogger.error('❌ Error generating thumbnail:', error)
      return NextResponse.json(
        { error: 'Error generando thumbnail' },
        { status: 500 }
      )
    }
  } catch (error) {
    thumbLogger.error('❌ Error in thumbnail route:', error)
    return NextResponse.json(
      { error: 'Error al procesar la miniatura' },
      { status: 500 }
    )
  }
}
