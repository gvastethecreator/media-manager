import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { ThumbnailQuality } from '@/services/thumbnail.service'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quality = (request.nextUrl.searchParams.get('quality') || 'mid') as ThumbnailQuality
    const { id } = params

    // Obtener la imagen
    const image = await prisma.image.findUnique({
      where: { id },
      select: {
        thumbnail: true,
        thumbnailError: true,
        path: true
      }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      )
    }

    if (image.thumbnailError) {
      return NextResponse.json(
        { error: image.thumbnailError },
        { status: 500 }
      )
    }

    if (!image.thumbnail) {
      // Si no existe el thumbnail, intentar generarlo
      try {
        const result = await generateThumbnail(image.path, quality)
        if (!result || !result.buffer) {
          throw new Error('Error generando thumbnail')
        }

        // Actualizar en base de datos
        await prisma.image.update({
          where: { id },
          data: {
            thumbnail: result.buffer,
            thumbnailSize: result.buffer.length,
            thumbnailWidth: result.width,
            thumbnailHeight: result.height,
            thumbnailError: null,
            thumbnailErrorAt: null
          }
        })

        // Devolver el nuevo thumbnail
        return new NextResponse(result.buffer, {
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000'
          }
        })
      } catch (error) {
        console.error('Error generando thumbnail:', error)
        return NextResponse.json(
          { error: 'Error generando thumbnail' },
          { status: 500 }
        )
      }
    }

    // Devolver la miniatura existente
    return new NextResponse(image.thumbnail, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  } catch (error) {
    console.error('Error en GET thumbnail:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}