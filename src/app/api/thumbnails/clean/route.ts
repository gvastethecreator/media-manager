import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
        thumbnail: { not: null }
      },
      select: {
        id: true,
        path: true
      }
    })

    const total = images.length
    let cleaned = 0

    // Enviar evento inicial
    await sendEvent('progress', {
      current: cleaned,
      total,
      progress: 0,
      status: `Encontradas ${total} miniaturas para limpiar...`
    })

    // Procesar cada imagen
    for (const image of images) {
      try {
        // Limpiar thumbnail
        await prisma.image.update({
          where: { id: image.id },
          data: {
            thumbnail: null,
            thumbnailSize: null,
            thumbnailWidth: null,
            thumbnailHeight: null,
            thumbnailError: null,
            thumbnailErrorAt: null,
            thumbnailQuality: null
          }
        })

        cleaned++
        const progress = Math.round((cleaned / total) * 100)

        // Enviar evento de progreso
        await sendEvent('progress', {
          current: cleaned,
          total,
          progress,
          currentFile: image.path,
          status: `Limpiando miniatura ${cleaned} de ${total}...`
        })

      } catch (error) {
        console.error('Error limpiando miniatura:', error)

        // Enviar evento de error
        await sendEvent('error', {
          file: image.path,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    // Enviar evento de completado
    await sendEvent('complete', {
      cleaned,
      total
    })

  } catch (error) {
    console.error('Error en limpieza:', error)
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