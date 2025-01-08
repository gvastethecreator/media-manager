import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { optimizeThumbnail } from '@/lib/thumbnails'
import { logger } from '@/lib/logger'

const thumbLogger = logger.withContext('ThumbnailOptimize')

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const writeEvent = async (event: string, data: any) => {
    try {
      await writer.write(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      )
    } catch (error) {
      thumbLogger.error('Error writing event:', error)
    }
  }

  try {
    // Obtener imágenes con miniaturas
    const images = await prisma.image.findMany({
      where: {
        thumbnail: { not: null }
      },
      select: {
        id: true,
        path: true,
        name: true,
        thumbnail: true,
        thumbnailSize: true
      }
    })

    const total = images.length
    let current = 0
    let optimized = 0
    let errors = 0
    let totalSaved = 0

    // Enviar estado inicial
    await writeEvent('start', {
      total,
      status: 'Iniciando optimización...'
    })

    // Procesar cada imagen
    for (const image of images) {
      current++
      const progress = Math.round((current / total) * 100)

      try {
        // Optimizar miniatura
        const result = await optimizeThumbnail(image.thumbnail!)

        if (result && result.size < (image.thumbnailSize || 0)) {
          // Actualizar miniatura si es más pequeña
          await prisma.image.update({
            where: { id: image.id },
            data: {
              thumbnail: result.data,
              thumbnailSize: result.size,
              thumbnailWidth: result.width,
              thumbnailHeight: result.height,
              thumbnailOptimizedAt: new Date()
            }
          })

          const saved = (image.thumbnailSize || 0) - result.size
          totalSaved += saved
          optimized++

          await writeEvent('progress', {
            current,
            total,
            progress,
            currentFile: image.path,
            status: `Optimizando ${current} de ${total}`,
            lastProcessed: {
              id: image.id,
              path: image.path,
              processedAt: new Date().toISOString(),
              saved
            }
          })
        }
      } catch (error) {
        thumbLogger.error('Error optimizing image:', error)
        errors++

        // Enviar error
        await writeEvent('error', {
          imageId: image.id,
          path: image.path,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }

      // Pequeña pausa para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Enviar evento de finalización
    await writeEvent('complete', {
      optimized,
      errors,
      total,
      totalSaved
    })

    await writer.close()
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    thumbLogger.error('Error en optimización:', error)
    await writeEvent('error', {
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
    await writer.close()
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  }
}