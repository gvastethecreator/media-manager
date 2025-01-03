import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { ThumbnailQuality } from '@/services/thumbnail.service'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const quality = (request.nextUrl.searchParams.get('quality') || 'mid') as ThumbnailQuality
    const id = context.params.id

    // Obtener la imagen
    const image = await prisma.image.findUnique({
      where: { id },
      select: {
        thumbnail: true,
        thumbnailError: true
      }
    })

    if (!image) {
      return new NextResponse('Imagen no encontrada', { status: 404 })
    }

    if (image.thumbnailError) {
      return new NextResponse(image.thumbnailError, { status: 500 })
    }

    if (!image.thumbnail) {
      return new NextResponse('Miniatura no disponible', { status: 404 })
    }

    // Devolver la miniatura como webp
    return new NextResponse(image.thumbnail, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  } catch (error) {
    console.error('Error en GET thumbnail:', error)
    return new NextResponse(
      error instanceof Error ? error.message : 'Error interno del servidor',
      { status: 500 }
    )
  }
}