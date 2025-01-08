import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { existsSync } from 'fs'
import { ThumbnailQuality } from '@/services/thumbnail.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const writeEvent = async (event: string, data: any) => {
    try {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ type: event, data })}\n\n`)
      )
    } catch (error) {
      console.error('Error writing event:', error)
    }
  }

  try {
    // Obtener imágenes con thumbnail
    const images = await prisma.image.findMany({
      where: {
        thumbnail: { not: null },
        thumbnailError: null
      },
      select: {
        id: true,
        path: true,
        name: true,
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
        // Verificar que el archivo existe
        if (!existsSync(image.path)) {
          await writeEvent('error', {
            imageId: image.id,
            path: image.path,
            error: 'Archivo no encontrado'
          })
          errors++
          continue
        }

        const originalSize = image.thumbnailSize || 0

        // Generar thumbnail optimizado
        const thumbnail = await generateThumbnail(image.path, { quality: 'compressed' })

        if (!thumbnail || !thumbnail.buffer) {
          throw new Error('Error generando thumbnail optimizado')
        }

        // Si el nuevo thumbnail es más pequeño, actualizarlo
        if (thumbnail.buffer.length < originalSize) {
          await prisma.image.update({
            where: { id: image.id },
            data: {
              thumbnail: thumbnail.buffer,
              thumbnailSize: thumbnail.buffer.length,
              thumbnailWidth: thumbnail.width,
              thumbnailHeight: thumbnail.height,
              thumbnailError: null,
              thumbnailErrorAt: null
            }
          })

          totalSaved += originalSize - thumbnail.buffer.length
          optimized++
        }

        // Enviar progreso
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
            saved: originalSize - thumbnail.buffer.length
          }
        })
      } catch (error) {
        console.error('Error optimizando imagen:', error)
        errors++

        // Actualizar error en base de datos
        await prisma.image.update({
          where: { id: image.id },
          data: {
            thumbnailError: error instanceof Error ? error.message : 'Error desconocido',
            thumbnailErrorAt: new Date()
          }
        })

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
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Error en optimización:', error)
    await writeEvent('error', {
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
    await writer.close()
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  }
}