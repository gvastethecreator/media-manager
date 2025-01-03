import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { existsSync } from 'fs'
import { ThumbnailQuality } from '@/services/thumbnail.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params)
    const { quality = 'mid' } = await request.json()

    // Validar ID
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
      const result = await generateThumbnail(image.path, quality as ThumbnailQuality)

      if (!result) {
        throw new Error('Error generando miniatura')
      }

      // Validar el resultado
      if (!result.buffer || result.buffer.length === 0) {
        throw new Error('Buffer de miniatura inválido')
      }

      // Actualizar en base de datos
      await prisma.image.update({
        where: { id },
        data: {
          thumbnail: result.buffer.toString('base64'),
          thumbnailSize: result.buffer.length,
          thumbnailWidth: result.width,
          thumbnailHeight: result.height,
          thumbnailQuality: quality,
          thumbnailError: null,
          thumbnailErrorAt: null,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        status: 'success',
        data: {
          width: result.width,
          height: result.height,
          size: result.buffer.length
        }
      })
    } catch (error) {
      console.error('Error generando thumbnail:', error)

      // Actualizar error en base de datos
      await prisma.image.update({
        where: { id },
        data: {
          thumbnailError: error instanceof Error ? error.message : 'Error desconocido',
          thumbnailErrorAt: new Date(),
          thumbnail: null, // Limpiar thumbnail si existe
          thumbnailSize: null,
          thumbnailWidth: null,
          thumbnailHeight: null
        }
      })

      return NextResponse.json(
        {
          error: 'Error al generar la miniatura',
          details: error instanceof Error ? error.message : 'Error desconocido'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error en generación de thumbnail:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}