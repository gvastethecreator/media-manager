import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import { existsSync } from 'fs'
import { THUMBNAIL_QUALITY_CONFIG } from '@/services/thumbnail.service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params)
    const { searchParams } = new URL(request.url)
    const quality = searchParams.get('quality') || 'mid'
    const qualityConfig = THUMBNAIL_QUALITY_CONFIG[quality]

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
      // Generar preview
      const imageBuffer = await sharp(image.path)
        .resize(qualityConfig.width * 2, qualityConfig.height * 2, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: qualityConfig.quality })
        .toBuffer()

      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000',
          'Content-Length': imageBuffer.length.toString()
        }
      })
    } catch (error) {
      console.error('Error generating preview:', error)

      // Registrar error
      await prisma.image.update({
        where: { id },
        data: {
          thumbnailError: error instanceof Error ? error.message : String(error),
          thumbnailErrorAt: new Date()
        }
      })

      return NextResponse.json(
        { error: 'Error al generar preview' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in preview route:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}