import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const sendEvent = async (type: string, data: any) => {
    try {
      const formattedData = JSON.stringify({ type, data })
      await writer.write(encoder.encode(`data: ${formattedData}\n\n`))
      console.log('Evento enviado:', { type, data })
    } catch (error) {
      console.error('Error enviando evento:', error)
      throw error
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
        thumbnailSize: true
      }
    })

    const total = images.length
    let optimized = 0

    // Enviar evento inicial
    await sendEvent('progress', {
      current: optimized,
      total,
      progress: 0,
      status: `Encontradas ${total} miniaturas para optimizar...`
    })

    // Procesar cada imagen
    for (const image of images) {
      try {
        if (!existsSync(image.path)) {
          throw new Error('Archivo original no encontrado')
        }

        // Generar thumbnail optimizado
        const result = await generateThumbnail(image.path, 'compressed')

        if (!result || !result.buffer) {
          throw new Error('Error generando thumbnail optimizado')
        }

        // Solo actualizar si el nuevo tamaño es menor
        if (result.buffer.length < (image.thumbnailSize || Infinity)) {
          await prisma.image.update({
            where: { id: image.id },
            data: {
              thumbnail: result.buffer,
              thumbnailSize: result.buffer.length,
              thumbnailWidth: result.width,
              thumbnailHeight: result.height,
              thumbnailError: null,
              thumbnailErrorAt: null,
              updatedAt: new Date()
            }
          })
        }

        optimized++
        const progress = Math.round((optimized / total) * 100)

        // Enviar evento de progreso
        await sendEvent('progress', {
          current: optimized,
          total,
          progress,
          currentFile: image.path,
          status: `Optimizando miniatura ${optimized} de ${total}...`,
          lastProcessed: {
            id: image.id,
            path: image.path,
            thumbnailPath: `/api/images/${image.id}/thumbnail`,
            processedAt: new Date().toISOString()
          }
        })

      } catch (error) {
        console.error('Error optimizando miniatura:', error)

        // Enviar evento de error
        await sendEvent('error', {
          file: image.path,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    // Enviar evento de completado
    await sendEvent('complete', {
      optimized,
      total
    })

  } catch (error) {
    console.error('Error en optimización:', error)
    await sendEvent('error', {
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
  } finally {
    await writer.close()
  }

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}