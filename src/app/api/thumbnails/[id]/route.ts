import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { ThumbnailQuality } from '@/services/thumbnail.service'
import { logger } from '@/lib/logger'

const thumbLogger = logger.withContext('ThumbnailRoute')

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params)
    const { id } = params
    const { searchParams } = new URL(request.url)
    const quality = (searchParams.get('quality') || 'medium') as ThumbnailQuality

    thumbLogger.info('🔄 Solicitud de thumbnail:', { id, quality })

    if (!id) {
      return NextResponse.json(
        { error: 'ID de imagen requerido' },
        { status: 400 }
      )
    }

    // Obtener la imagen
    const image = await prisma.image.findUnique({
      where: { id }
    })

    if (!image) {
      thumbLogger.error('❌ Imagen no encontrada:', { id })
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      )
    }

    // Si ya tiene thumbnail, devolverlo
    if (image.thumbnail) {
      const base64Thumbnail = Buffer.from(image.thumbnail).toString('base64')

      thumbLogger.info('✅ Thumbnail encontrado en caché:', {
        id,
        size: image.thumbnailSize,
        width: image.thumbnailWidth,
        height: image.thumbnailHeight
      })

      return NextResponse.json({
        thumbnail: base64Thumbnail,
        width: image.thumbnailWidth,
        height: image.thumbnailHeight,
        size: image.thumbnailSize,
        mimeType: 'image/webp'
      }, {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      })
    }

    // Si no tiene thumbnail, generarlo
    try {
      thumbLogger.info('🔄 Generando nuevo thumbnail:', { id, path: image.path })
      const thumbnail = await generateThumbnail(image.path, { quality: quality as ThumbnailQuality })

      if (!thumbnail || !thumbnail.buffer) {
        throw new Error('No se pudo generar el thumbnail')
      }

      // Convertir el buffer a base64
      const base64Thumbnail = Buffer.from(thumbnail.buffer).toString('base64')

      // Actualizar la imagen con el nuevo thumbnail
      await prisma.image.update({
        where: { id },
        data: {
          thumbnail: thumbnail.buffer,
          thumbnailSize: thumbnail.buffer.length,
          thumbnailWidth: thumbnail.width,
          thumbnailHeight: thumbnail.height
        }
      })

      thumbLogger.info('✅ Nuevo thumbnail generado:', {
        id,
        size: thumbnail.buffer.length,
        width: thumbnail.width,
        height: thumbnail.height
      })

      return NextResponse.json({
        thumbnail: base64Thumbnail,
        width: thumbnail.width,
        height: thumbnail.height,
        size: thumbnail.buffer.length,
        mimeType: 'image/webp'
      }, {
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      })
    } catch (error) {
      thumbLogger.error('❌ Error generando thumbnail:', { id, error })
      return NextResponse.json(
        { error: 'Error generando thumbnail' },
        { status: 500 }
      )
    }
  } catch (error) {
    thumbLogger.error('❌ Error en thumbnail route:', { error })
    return NextResponse.json(
      { error: 'Error al procesar la miniatura' },
      { status: 500 }
    )
  }
}