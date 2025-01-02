import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/image'
import { ThumbnailQuality } from '@/services/thumbnail.service'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quality = (request.nextUrl.searchParams.get('quality') || 'mid') as ThumbnailQuality
    const id = params.id

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
      const buffer = Buffer.from(image.thumbnail, 'base64')
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000'
        }
      })
    }

    // Verificar que el archivo existe
    if (!existsSync(image.path)) {
      await prisma.image.update({
        where: { id },
        data: {
          thumbnailError: 'Archivo original no encontrado',
          thumbnailErrorAt: new Date()
        }
      })
      return NextResponse.json(
        { error: 'Archivo original no encontrado' },
        { status: 404 }
      )
    }

    try {
      // Generar thumbnail
      const result = await generateThumbnail(image.path, quality)
      if (!result) {
        throw new Error('Error generando miniatura')
      }

      // Actualizar en base de datos
      await prisma.image.update({
        where: { id },
        data: {
          thumbnail: result.data,
          thumbnailSize: result.size,
          thumbnailWidth: result.width,
          thumbnailHeight: result.height,
          thumbnailQuality: quality,
          thumbnailError: null,
          thumbnailErrorAt: null
        }
      })

      const buffer = Buffer.from(result.data, 'base64')
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000'
        }
      })
    } catch (error) {
      console.error('Error generando thumbnail:', error)

      // Actualizar error en base de datos
      await prisma.image.update({
        where: { id },
        data: {
          thumbnailError: error instanceof Error ? error.message : 'Error desconocido',
          thumbnailErrorAt: new Date()
        }
      })

      return NextResponse.json(
        { error: 'Error al generar la miniatura' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error en obtención de thumbnail:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}