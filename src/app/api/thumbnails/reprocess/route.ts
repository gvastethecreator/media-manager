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

  // Configurar la respuesta SSE primero
  const response = new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Accel-Buffering': 'no'
    }
  })

  const writeEvent = async (event: string, data: any) => {
    try {
      // Formato correcto para SSE con retry
      const formattedData = `retry: 1000\nid: ${Date.now()}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`
      await writer.write(encoder.encode(formattedData))
      console.log('Evento enviado:', { type: event, data })
    } catch (error) {
      console.error('Error writing event:', error)
    }
  }

  try {
    // Enviar un ping inicial para mantener la conexión
    await writeEvent('ping', { timestamp: Date.now() })

    // Obtener todas las imágenes que necesitan reprocesamiento
    const images = await prisma.image.findMany({
      where: {
        OR: [
          { thumbnail: null },
          { thumbnailError: { not: null } }
        ]
      },
      select: {
        id: true,
        path: true,
        name: true
      }
    })

    const total = images.length
    let current = 0
    let processed = 0
    let errors = 0

    // Enviar estado inicial
    await writeEvent('start', {
      total,
      current: 0,
      progress: 0,
      status: 'Iniciando reprocesamiento...'
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

        // Generar thumbnail
        const thumbnail = await generateThumbnail(image.path, { quality: 'mid' })

        if (!thumbnail || !thumbnail.buffer) {
          throw new Error('Error generando thumbnail')
        }

        // Actualizar en base de datos
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

        processed++

        // Enviar progreso
        await writeEvent('progress', {
          current,
          total,
          progress,
          currentFile: image.path,
          status: `Procesando ${current} de ${total}`,
          lastProcessed: {
            id: image.id,
            path: image.path,
            processedAt: new Date().toISOString()
          }
        })

        // Enviar ping cada 10 segundos para mantener la conexión viva
        if (current % 10 === 0) {
          await writeEvent('ping', { timestamp: Date.now() })
        }
      } catch (error) {
        console.error('Error procesando imagen:', error)
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
      processed,
      errors,
      total
    })

    await writer.close()
    return response
  } catch (error) {
    console.error('Error en reprocesamiento:', error)
    await writeEvent('error', {
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
    await writer.close()
    return response
  }
}