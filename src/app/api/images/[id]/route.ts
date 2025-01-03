import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ImageOptimizer } from '@/lib/image-optimizer'
import path from 'path'

const imageOptimizer = new ImageOptimizer()

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const width = searchParams.get('w') ? parseInt(searchParams.get('w')!) : undefined
    const height = searchParams.get('h') ? parseInt(searchParams.get('h')!) : undefined
    const quality = searchParams.get('q') ? parseInt(searchParams.get('q')!) : undefined
    const format = searchParams.get('format') || 'webp'

    const image = await prisma.image.findUnique({
      where: { id: context.params.id }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si es una solicitud de thumbnail
    const isThumbnail = searchParams.get('thumbnail') === 'true'

    if (isThumbnail) {
      // Si ya tenemos un thumbnail guardado y no está corrupto, usarlo
      if (image.thumbnail && !image.thumbnailError) {
        return new NextResponse(Buffer.from(image.thumbnail, 'base64'), {
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable'
          }
        })
      }

      try {
        // Generar nuevo thumbnail
        const thumbnail = await imageOptimizer.generateThumbnail(image.path, {
          width: 300,
          height: 300,
          quality: 60
        })

        // Guardar el thumbnail en la base de datos
        await prisma.image.update({
          where: { id: image.id },
          data: {
            thumbnail,
            thumbnailError: null,
            thumbnailErrorAt: null
          }
        })

        return new NextResponse(Buffer.from(thumbnail, 'base64'), {
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable'
          }
        })
      } catch (error) {
        console.error('Error generando thumbnail:', error)
        await prisma.image.update({
          where: { id: image.id },
          data: {
            thumbnailError: error.message,
            thumbnailErrorAt: new Date()
          }
        })
        throw error
      }
    }

    // Para imágenes completas, optimizar según parámetros
    const { buffer } = await imageOptimizer.optimizeImage(image.path, {
      width,
      height,
      quality
    })

    // Actualizar estadísticas
    await prisma.imageStats.upsert({
      where: { imageId: image.id },
      create: {
        imageId: image.id,
        views: 1,
        downloads: 0,
        lastViewed: new Date()
      },
      update: {
        views: { increment: 1 },
        lastViewed: new Date()
      }
    })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': `image/${format}`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('Error serving image:', error)
    return NextResponse.json(
      { error: 'Error al procesar la imagen' },
      { status: 500 }
    )
  }
}