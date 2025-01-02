import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { readFile } from 'fs/promises'

// Asegurarnos de que el directorio de thumbnails existe
const THUMBNAILS_DIR = join(process.cwd(), 'thumbnails')
if (!existsSync(THUMBNAILS_DIR)) {
  mkdirSync(THUMBNAILS_DIR, { recursive: true })
}

// Función auxiliar para obtener la ruta del thumbnail
function getThumbnailPath(id: string) {
  return join(THUMBNAILS_DIR, `${id}.webp`)
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  if (!context?.params?.id) {
    return NextResponse.json(
      { error: 'ID de imagen no proporcionado' },
      { status: 400 }
    )
  }

  const id = context.params.id

  try {
    // Obtener la imagen
    const image = await prisma.image.findUnique({
      where: { id },
      select: {
        id: true,
        path: true,
        thumbnail: true
      }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      )
    }

    // Si la imagen tiene un thumbnail en la base de datos, usarlo
    if (image.thumbnail) {
      return new NextResponse(image.thumbnail, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000'
        }
      })
    }

    // Si no, intentar leer del sistema de archivos
    const thumbnailPath = getThumbnailPath(image.id)
    if (!existsSync(thumbnailPath)) {
      return NextResponse.json(
        { error: 'Thumbnail no encontrado' },
        { status: 404 }
      )
    }

    const thumbnailBuffer = await readFile(thumbnailPath)
    return new NextResponse(thumbnailBuffer, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000',
        'Content-Length': thumbnailBuffer.length.toString()
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