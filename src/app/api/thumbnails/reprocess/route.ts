import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
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
    // Obtener imágenes que necesitan reprocesar
    const images = await prisma.image.findMany({
      where: {
        OR: [
          { thumbnail: null },
          { thumbnailError: { not: null } }
        ]
      },
      select: {
        id: true,
        path: true
      }
    })

    const total = images.length
    let processed = 0
    let errors = 0

    // Enviar evento inicial
    await sendEvent('progress', {
      current: processed,
      total,
      progress: 0,
      status: `Encontradas ${total} imágenes para procesar...`
    })

    // Procesar cada imagen
    for (const image of images) {
      try {
        if (!existsSync(image.path)) {
          throw new Error('Archivo no encontrado')
        }

        // Generar thumbnail
        const result = await generateThumbnail(image.path, 'mid')

        if (!result || !result.buffer) {
          throw new Error('Error generando thumbnail')
        }

        // Actualizar en base de datos
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

        processed++
        const progress = Math.round((processed / total) * 100)

        // Enviar evento de progreso
        await sendEvent('progress', {
          current: processed,
          total,
          progress,
          currentFile: image.path,
          status: `Procesando imagen ${processed} de ${total}...`
        })

      } catch (error) {
        errors++
        console.error('Error procesando imagen:', error)

        // Actualizar error en base de datos
        await prisma.image.update({
          where: { id: image.id },
          data: {
            thumbnailError: error instanceof Error ? error.message : 'Error desconocido',
            thumbnailErrorAt: new Date(),
            thumbnail: null,
            thumbnailSize: null,
            thumbnailWidth: null,
            thumbnailHeight: null
          }
        })

        // Enviar evento de error
        await sendEvent('error', {
          file: image.path,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    // Enviar evento de completado
    await sendEvent('complete', {
      processed,
      total,
      errors,
      recentlyProcessed: await prisma.image.findMany({
        where: {
          thumbnail: { not: null },
          thumbnailError: null
        },
        orderBy: { updatedAt: 'desc' },
        take: 12,
        select: {
          id: true,
          path: true,
          thumbnail: true,
          thumbnailWidth: true,
          thumbnailHeight: true,
          updatedAt: true
        }
      })
    })

  } catch (error) {
    console.error('Error en reprocesamiento:', error)
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