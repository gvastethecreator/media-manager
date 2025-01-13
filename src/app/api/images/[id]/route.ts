import { NextRequest, NextResponse } from 'next/server'
import { generateThumbnail } from '@/lib/thumbnail'
import { prisma } from '@/lib/prisma'
import { existsSync } from 'fs'
import { ThumbnailQuality } from '@/types/thumbnails'
import { logger } from '@/lib/logger'

const imageLogger = logger.withContext('ImageAPI')

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id
    const { searchParams } = new URL(request.url)
    const quality = (searchParams.get('quality') || 'medium') as ThumbnailQuality

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
      const result = await generateThumbnail(image.path, { quality })

      // Actualizar en base de datos
      await prisma.image.update({
        where: { id },
        data: {
          thumbnail: result.buffer,
          thumbnailSize: result.size,
          thumbnailWidth: result.width,
          thumbnailHeight: result.height,
          thumbnailError: null,
          thumbnailErrorAt: null,
          updatedAt: new Date()
        }
      })

      // Devolver la imagen optimizada
      return new NextResponse(result.buffer, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000',
          'Content-Length': result.size.toString()
        }
      })

    } catch (error) {
      imageLogger.error('Error procesando imagen:', error)

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
        { error: 'Error procesando imagen' },
        { status: 500 }
      )
    }
  } catch (error) {
    imageLogger.error('Error en ruta de imagen:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Esperar y extraer los parámetros de manera asíncrona
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    const data = await request.json();

    const updatedImage = await prisma.image.update({
      where: { id },
      data,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            path: true
          }
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        collections: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        stats: {
          select: {
            views: true,
            downloads: true,
            lastViewed: true
          }
        }
      }
    });

    return NextResponse.json(updatedImage);
  } catch (error) {
    console.error("Error updating image:", error);
    return NextResponse.json(
      { error: "Error al actualizar la imagen" },
      { status: 500 }
    );
  }
}