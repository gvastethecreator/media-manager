import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const folderId = params.id

    // Obtener imágenes de la carpeta
    const images = await prisma.image.findMany({
      where: { folderId },
      orderBy: { name: 'asc' }
    })

    // Convertir las imágenes al formato esperado por VirtualizedView
    const files = images.map(image => ({
      id: image.id,
      name: image.name,
      path: image.path,
      size: image.size,
      type: image.mimeType,
      lastModified: image.updatedAt,
      isDirectory: false,
      metadata: image.metadata ? JSON.parse(image.metadata) : null,
      thumbnailUrl: `/api/images/${image.id}/thumbnail`,
      previewUrl: `/api/images/${image.id}/preview`,
      downloadUrl: `/api/images/${image.id}/download`
    }))

    return NextResponse.json(files)
  } catch (error) {
    console.error('Error en GET /api/folders/[id]/files:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
