import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { ThumbnailQuality } from '@/services/thumbnail.service'
import { existsSync } from 'fs'

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id
    const body = await request.json()
    const quality = body.quality as ThumbnailQuality

    if (!quality) {
      return NextResponse.json(
        { error: 'Calidad no especificada' },
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
          thumbnailErrorAt: null,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        width: result.width,
        height: result.height,
        size: result.buffer.length
      })

    } catch (error) {
      console.error('Error generando thumbnail:', error)

      // Actualizar error en base de datos
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

      return NextResponse.json(
        { error: 'Error al generar la miniatura' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error en generación de thumbnail:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}