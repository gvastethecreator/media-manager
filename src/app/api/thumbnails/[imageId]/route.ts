import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  try {
    const { imageId } = params

    // Obtener la imagen
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: {
        thumbnail: true,
        thumbnailError: true
      }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      )
    }

    if (image.thumbnailError) {
      return NextResponse.json(
        { error: image.thumbnailError },
        { status: 500 }
      )
    }

    if (!image.thumbnail) {
      // Intentar leer del sistema de archivos
      const thumbnailPath = path.join(process.cwd(), 'thumbnails', `${imageId}.webp`)
      try {
        const thumbnail = await fs.readFile(thumbnailPath)
        return new NextResponse(thumbnail, {
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable'
          }
        })
      } catch {
        return NextResponse.json(
          { error: 'Miniatura no encontrada' },
          { status: 404 }
        )
      }
    }

    // Devolver la miniatura desde la base de datos
    return new NextResponse(image.thumbnail, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('Error al obtener miniatura:', error)
    return NextResponse.json(
      { error: 'Error al obtener miniatura' },
      { status: 500 }
    )
  }
}