import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { ThumbnailQuality } from '@/services/thumbnail.service'

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
    const quality = (searchParams.get('quality') || 'mid') as ThumbnailQuality

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
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      )
    }

    // Si ya tiene thumbnail, devolverlo
    if (image.thumbnail) {
      const headers = new Headers()
      headers.set('Content-Type', 'image/webp')
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')

      return new NextResponse(image.thumbnail, {
        headers,
        status: 200
      })
    }

    // Si no tiene thumbnail, generarlo
    try {
      const thumbnail = await generateThumbnail(image.path, { quality: quality as ThumbnailQuality })

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
          thumbnailHeight: thumbnail.height
        }
      })

      const headers = new Headers()
      headers.set('Content-Type', 'image/webp')
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')

      return new NextResponse(thumbnail.buffer, {
        headers,
        status: 200
      })
    } catch (error) {
      console.error('Error generando thumbnail:', error)
      return NextResponse.json(
        { error: 'Error generando thumbnail' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error en thumbnail route:', error)
    return NextResponse.json(
      { error: 'Error al procesar la miniatura' },
      { status: 500 }
    )
  }
}