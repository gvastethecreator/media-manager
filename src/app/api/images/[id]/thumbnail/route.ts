import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import { existsSync } from 'fs'
import { promises as fs } from 'fs'
import { THUMBNAIL_QUALITY_CONFIG, type ThumbnailQuality } from '@/services/thumbnail.service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id
    console.log('🔍 Thumbnail request for ID:', id)

    const file = await prisma.image.findUnique({
      where: { id }
    })

    if (!file) {
      console.log('❌ Image not found in database:', id)
      return new NextResponse('Image not found', { status: 404 })
    }

    console.log('📄 Image found:', {
      id: file.id,
      path: file.path,
      hasThumbnail: !!file.thumbnail,
      hasError: !!file.thumbnailError
    })

    // Verificar que el archivo existe
    if (!existsSync(file.path)) {
      console.log('❌ Original file not found at path:', file.path)
      return new NextResponse('Original file not found', { status: 404 })
    }

    // Si ya existe el thumbnail y no hay error, lo devolvemos
    if (file.thumbnail && !file.thumbnailError) {
      console.log('✅ Returning existing thumbnail')
      return new NextResponse(Buffer.from(file.thumbnail, 'base64'), {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Length': Buffer.from(file.thumbnail, 'base64').length.toString(),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET'
        }
      })
    }

    // Si no existe el thumbnail o hay error, lo creamos
    console.log('🔄 Generating new thumbnail...')
    try {
      const imageBuffer = await sharp(file.path)
        .resize(200, 200, {
          fit: 'cover',
          position: 'centre'
        })
        .webp({ quality: 80 })
        .toBuffer()

      console.log('✅ Thumbnail generated successfully:', {
        size: imageBuffer.length,
        format: 'webp'
      })

      // Guardar el thumbnail en la base de datos
      await prisma.image.update({
        where: { id },
        data: {
          thumbnail: Buffer.from(imageBuffer).toString('base64'),
          thumbnailSize: imageBuffer.length,
          thumbnailError: null,
          thumbnailErrorAt: null
        }
      })

      console.log('💾 Thumbnail saved to database')

      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Length': imageBuffer.length.toString(),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET'
        }
      })
    } catch (error) {
      console.error('❌ Error generating thumbnail:', {
        error: error instanceof Error ? error.message : error,
        path: file.path
      })

      // Guardar el error en la base de datos
      await prisma.image.update({
        where: { id },
        data: {
          thumbnailError: error instanceof Error ? error.message : 'Unknown error',
          thumbnailErrorAt: new Date()
        }
      })

      console.log('🔄 Attempting fallback resize...')
      // Intentar devolver la imagen original redimensionada
      try {
        const originalBuffer = await fs.readFile(file.path)
        console.log('📄 Original file read:', {
          size: originalBuffer.length
        })

        const resizedBuffer = await sharp(originalBuffer)
          .resize(200, 200, {
            fit: 'cover',
            position: 'centre'
          })
          .toBuffer()

        console.log('✅ Fallback resize successful:', {
          originalSize: originalBuffer.length,
          resizedSize: resizedBuffer.length
        })

        return new NextResponse(resizedBuffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Length': resizedBuffer.length.toString(),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET'
          }
        })
      } catch (fallbackError) {
        console.error('❌ Fallback resize failed:', fallbackError)
        return new NextResponse('Error processing image', { status: 500 })
      }
    }
  } catch (error) {
    console.error('❌ Unhandled error in thumbnail route:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })
    return new NextResponse('Internal server error', { status: 500 })
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
          thumbnail: imageBuffer.toString('base64'),
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
