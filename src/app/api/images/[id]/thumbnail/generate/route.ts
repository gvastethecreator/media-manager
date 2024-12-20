import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import { THUMBNAIL_QUALITY_CONFIG, ThumbnailQuality } from '@/services/thumbnail.service'
import { queueThumbnail } from '@/lib/queue'

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

    // Si force es false y ya tiene thumbnail, no regenerar
    if (!force && image.thumbnail) {
      return NextResponse.json({ status: 'skipped', message: 'Thumbnail already exists' })
    }

    // Encolar el trabajo de generación de thumbnail
    await queueThumbnail(params.id, quality, force)

    return NextResponse.json({ status: 'queued', message: 'Thumbnail generation queued' })
  } catch (error) {
    console.error('Error generating thumbnail:', error)
    return NextResponse.json(
      { error: 'Error generating thumbnail' },
      { status: 500 }
    )
  }
}
