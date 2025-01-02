import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { THUMBNAIL_QUALITY_CONFIG } from '@/services/thumbnail.service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { quality } = await request.json()

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

    // Configuración de calidad
    const config = THUMBNAIL_QUALITY_CONFIG[quality] || THUMBNAIL_QUALITY_CONFIG.mid

    // Generar miniatura
    const thumbnailBuffer = await sharp(image.path)
      .resize(config.width, config.height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: config.quality })
      .toBuffer()

    // Guardar miniatura
    const thumbnailDir = path.join(process.cwd(), 'thumbnails')
    const thumbnailPath = path.join(thumbnailDir, `${id}.webp`)
    await fs.writeFile(thumbnailPath, thumbnailBuffer)

    // Actualizar base de datos
    await prisma.image.update({
      where: { id },
      data: {
        thumbnail: thumbnailBuffer,
        thumbnailSize: thumbnailBuffer.length,
        thumbnailWidth: config.width,
        thumbnailHeight: config.height,
        thumbnailError: null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error al generar miniatura:', error)

    // Registrar error en la base de datos
    await prisma.image.update({
      where: { id: params.id },
      data: {
        thumbnailError: error instanceof Error ? error.message : 'Error desconocido'
      }
    })

    return NextResponse.json(
      { error: 'Error al generar miniatura' },
      { status: 500 }
    )
  }
}