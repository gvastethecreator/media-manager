import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { existsSync } from 'fs'
import { createReadStream } from 'fs'
import { logger } from '@/lib/logger'
import { headers } from 'next/headers'
import * as path from 'path'
import * as mime from 'mime-types'

const imageLogger = logger.withContext('ImageContentAPI')

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Esperar los parámetros dinámicos
    const params = await Promise.resolve(context.params)
    const { id } = params

    const image = await prisma.image.findUnique({
      where: { id },
      select: {
        path: true,
        name: true,
        metadata: true,
      }
    })

    if (!image) {
      return new Response('Imagen no encontrada', { status: 404 })
    }

    if (!existsSync(image.path)) {
      return new Response('Archivo no encontrado', { status: 404 })
    }

    // Obtener el tipo MIME
    let mimeType = 'image/jpeg'
    try {
      if (image.metadata) {
        const metadata = JSON.parse(image.metadata)
        mimeType = metadata.mimeType || mime.lookup(image.path) || 'image/jpeg'
      }
    } catch (error) {
      imageLogger.warn('Error parsing metadata:', { error, path: image.path })
    }

    // Crear stream de lectura
    const stream = createReadStream(image.path)

    // Registrar la vista de forma asíncrona
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || 'unknown'

    // No esperamos a que se complete para no bloquear la respuesta
    prisma.imageStats.upsert({
      where: { imageId: id },
      create: {
        imageId: id,
        views: 1,
        downloads: 0,
        lastViewed: new Date()
      },
      update: {
        views: { increment: 1 },
        lastViewed: new Date()
      }
    }).catch(error => {
      imageLogger.error('Error updating stats:', { error, imageId: id })
    })

    // Crear y retornar respuesta con stream
    return new Response(stream as any, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': `inline; filename="${encodeURIComponent(image.name)}"`,
      },
    })
  } catch (error) {
    imageLogger.error('Error serving image:', { error })
    return new Response('Error interno del servidor', { status: 500 })
  }
}