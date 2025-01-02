import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params)

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

    // Eliminar thumbnail
    await prisma.image.update({
      where: { id },
      data: {
        thumbnail: null,
        thumbnailWidth: null,
        thumbnailHeight: null,
        thumbnailError: null,
        thumbnailErrorAt: null
      }
    })

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Error eliminando thumbnail:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la miniatura' },
      { status: 500 }
    )
  }
}