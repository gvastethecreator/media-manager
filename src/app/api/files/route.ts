import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    const images = await prisma.image.findMany({
      where: path ? { path: { startsWith: path } } : {},
      orderBy: { name: 'asc' },
      include: {
        folder: true,
        tags: true,
        collections: true
      }
    })

    // Convertir las imágenes al formato esperado por el cliente
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
      downloadUrl: `/api/images/${image.id}/download`,
      folder: image.folder ? {
        id: image.folder.id,
        name: image.folder.name,
        path: image.folder.path
      } : null,
      tags: image.tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color
      })),
      collections: image.collections.map(collection => ({
        id: collection.id,
        name: collection.name,
        emoji: collection.emoji
      }))
    }))

    return NextResponse.json(files)
  } catch (error) {
    console.error('Error en GET /api/files:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
