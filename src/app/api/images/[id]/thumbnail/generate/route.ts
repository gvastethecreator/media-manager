import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import { THUMBNAIL_QUALITY_CONFIG, ThumbnailQuality } from '@/services/thumbnail.service'
import { queueThumbnail } from '@/lib/queue'
import { existsSync } from 'fs'
import { pipeline } from 'stream/promises'
import { createReadStream } from 'fs'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { quality = 'mid', force = false } = await request.json()

    // Verificar si la imagen existe
    const image = await prisma.image.findUnique({
      where: { id: params.id }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Verificar que el archivo existe
    if (!existsSync(image.path)) {
      await prisma.image.update({
        where: { id: params.id },
        data: {
          thumbnailError: 'Original file not found',
          thumbnailErrorAt: new Date()
        }
      })
      return NextResponse.json(
        { error: 'Original file not found' },
        { status: 404 }
      )
    }

    // Si force es false y ya tiene thumbnail, no regenerar
    if (!force && image.thumbnail) {
      return NextResponse.json({ status: 'skipped', message: 'Thumbnail already exists' })
    }

    try {
      // Verificar tamaño del archivo
      const metadata = await sharp(image.path).metadata()
      if (metadata.size && metadata.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum allowed (${MAX_FILE_SIZE} bytes)`)
      }

      // Procesar imagen en streaming
      const transformer = sharp()
        .resize(THUMBNAIL_QUALITY_CONFIG[quality as ThumbnailQuality].width,
          THUMBNAIL_QUALITY_CONFIG[quality as ThumbnailQuality].height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: THUMBNAIL_QUALITY_CONFIG[quality as ThumbnailQuality].quality })

      const chunks: Buffer[] = []
      transformer.on('data', chunk => chunks.push(chunk))

      await pipeline(
        createReadStream(image.path),
        transformer
      )

      const thumbnailBuffer = Buffer.concat(chunks)

      // Actualizar en base de datos
      await prisma.image.update({
        where: { id: params.id },
        data: {
          thumbnail: thumbnailBuffer.toString('base64'),
          thumbnailSize: thumbnailBuffer.length,
          thumbnailQuality: quality,
          thumbnailError: null,
          thumbnailErrorAt: null,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        status: 'success',
        size: thumbnailBuffer.length,
        quality
      })

    } catch (error) {
      console.error('Error processing thumbnail:', error)

      // Actualizar error en base de datos
      await prisma.image.update({
        where: { id: params.id },
        data: {
          thumbnailError: error instanceof Error ? error.message : 'Unknown error',
          thumbnailErrorAt: new Date()
        }
      })

      return NextResponse.json(
        { error: 'Error generating thumbnail' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in thumbnail generation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
