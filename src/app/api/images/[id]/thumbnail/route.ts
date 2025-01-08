import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { THUMBNAIL_QUALITY_CONFIG } from '@/services/thumbnail.service'
import sharp from 'sharp'
import { existsSync } from 'fs'
import { ThumbnailQuality } from '@/services/thumbnail.service'

const thumbLogger = logger.withContext('ThumbnailAPI')

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    thumbLogger.info('🔍 Thumbnail request for ID:', id)

    const file = await prisma.image.findUnique({
      where: { id },
      select: {
        id: true,
        path: true,
        thumbnail: true,
        thumbnailError: true,
      },
    })

    if (!file) {
      thumbLogger.warn('❌ Image not found:', id)
      return new Response('Image not found', { status: 404 })
    }

    thumbLogger.debug('📄 Image found:', {
      id: file.id,
      path: file.path,
      hasThumbnail: !!file.thumbnail,
      hasError: !!file.thumbnailError,
    })

    if (!file.thumbnail) {
      if (file.thumbnailError) {
        thumbLogger.error('❌ Thumbnail error:', file.thumbnailError)
        return new Response('Thumbnail generation failed', { status: 500 })
      }
      thumbLogger.warn('⚠️ No thumbnail available')
      return new Response('Thumbnail not generated yet', { status: 404 })
    }

    thumbLogger.info('✅ Returning existing thumbnail')
    return new Response(file.thumbnail, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    thumbLogger.error('❌ Error serving thumbnail:', error)
    return new Response(
      JSON.stringify({
        error: 'Error serving thumbnail',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id
    const { quality = 'mid' } = await request.json() as { quality?: ThumbnailQuality }
    console.log('🔍 Thumbnail generation request:', { id, quality })

    const file = await prisma.image.findUnique({
      where: { id }
    })

    if (!file) {
      console.log('❌ Image not found in database:', id)
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      )
    }

    // Verificar que el archivo existe
    if (!existsSync(file.path)) {
      console.log('❌ Original file not found at path:', file.path)
      return NextResponse.json(
        { error: 'Original file not found' },
        { status: 404 }
      )
    }

    const qualityConfig = THUMBNAIL_QUALITY_CONFIG[quality]
    console.log('⚙️ Using quality config:', qualityConfig)

    try {
      // Generar thumbnail
      const imageBuffer = await sharp(file.path)
        .resize(qualityConfig.width, qualityConfig.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: qualityConfig.quality })
        .toBuffer()

      // Guardar en base de datos
      await prisma.image.update({
        where: { id },
        data: {
          thumbnail: new Uint8Array(imageBuffer),
          thumbnailSize: imageBuffer.length,
          thumbnailError: null,
          thumbnailErrorAt: null
        }
      })

      console.log('✅ Thumbnail generated successfully')
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('❌ Error generating thumbnail:', error)

      // Registrar el error en la base de datos
      await prisma.image.update({
        where: { id },
        data: {
          thumbnailError: error instanceof Error ? error.message : String(error),
          thumbnailErrorAt: new Date()
        }
      })

      return NextResponse.json(
        { error: 'Error generating thumbnail' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 }
    )
  }
}
