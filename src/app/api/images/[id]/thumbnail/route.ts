import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import { existsSync } from 'fs'
import { promises as fs } from 'fs'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context
  console.log('🔍 Thumbnail request for ID:', params.id)

  try {
    const file = await prisma.image.findUnique({
      where: { id: params.id }
    })

    if (!file) {
      console.log('❌ Image not found in database:', params.id)
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

    // Si no existe el thumbnail o hay error, lo creamos
    if (!file.thumbnail || file.thumbnailError) {
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

        // Actualizar la imagen con el thumbnail
        await prisma.image.update({
          where: { id: file.id },
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

        // Registrar el error en la base de datos
        await prisma.image.update({
          where: { id: file.id },
          data: {
            thumbnailError: error instanceof Error ? error.message : 'Error desconocido',
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
    }

    console.log('📦 Using cached thumbnail')
    // Si ya existe el thumbnail, lo retornamos
    const imageBuffer = Buffer.from(file.thumbnail, 'base64')
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
    console.error('❌ Unhandled error in thumbnail route:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })
    return new NextResponse('Internal server error', { status: 500 })
  }
}
