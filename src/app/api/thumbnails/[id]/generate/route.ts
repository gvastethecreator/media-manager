import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { existsSync } from 'fs'
import { ThumbnailQuality } from '@/services/thumbnail.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params)
    const { quality = 'mid' } = await request.json()

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
          thumbnailError: 'Original file not found',
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
      const result = await generateThumbnail(image.path, quality as ThumbnailQuality)

      if (!result) {
        throw new Error('Error generando miniatura')
      }

      // Actualizar en base de datos
      await prisma.image.update({
        where: { id },
        data: {
          thumbnail: result.buffer.toString('base64'),
          thumbnailWidth: result.width,
          thumbnailHeight: result.height,
          thumbnailError: null,
          thumbnailErrorAt: null
        }
      })

      return NextResponse.json({ status: 'success' })
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
    console.error('Error en generación de thumbnail:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}