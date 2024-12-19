import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    // Obtener todas las imágenes
    const images = await prisma.image.findMany({
      select: {
        id: true,
        path: true
      }
    })

    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Procesar cada imagen
    let processed = 0
    const total = images.length

    for (const image of images) {
      try {
        if (!existsSync(image.path)) {
          await prisma.image.update({
            where: { id: image.id },
            data: {
              thumbnailError: 'Original file not found',
              thumbnailErrorAt: new Date()
            }
          })
          continue
        }

        const imageBuffer = await sharp(image.path)
          .resize(200, 200, {
            fit: 'cover',
            position: 'centre'
          })
          .webp({ quality: 80 })
          .toBuffer()

        await prisma.image.update({
          where: { id: image.id },
          data: {
            thumbnail: Buffer.from(imageBuffer).toString('base64'),
            thumbnailSize: imageBuffer.length,
            thumbnailError: null,
            thumbnailErrorAt: null
          }
        })

        processed++
        const progress = Math.round((processed / total) * 100)
        await writer.write(encoder.encode(progress.toString()))
      } catch (error) {
        console.error(`Error processing thumbnail for image ${image.id}:`, error)
        await prisma.image.update({
          where: { id: image.id },
          data: {
            thumbnailError: error.message,
            thumbnailErrorAt: new Date()
          }
        })
      }
    }

    await writer.close()
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
      }
    })
  } catch (error) {
    console.error('Error reprocessing thumbnails:', error)
    return NextResponse.json(
      { error: 'Error reprocessing thumbnails' },
      { status: 500 }
    )
  }
}
