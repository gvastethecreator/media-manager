import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  const customHeaders = headers()

  try {
    // Configurar SSE
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    const sendEvent = async (event: { type: string, data: any }) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    }

    // Obtener imágenes para reprocesar
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

    // Iniciar respuesta SSE
    const response = new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

    // Procesar imágenes en background
    const processImages = async () => {
      try {
        let processed = 0
        let errors = 0
        const total = images.length

        for (const image of images) {
          try {
            await generateThumbnail(image.path, 'mid')
            processed++

            // Actualizar progreso
            await sendEvent({
              type: 'progress',
              data: {
                current: processed,
                total,
                currentFile: image.path,
                status: 'Procesando...',
                progress: Math.round((processed / total) * 100)
              }
            })

          } catch (error) {
            errors++
            console.error('Error procesando imagen:', error)
            await sendEvent({
              type: 'error',
              data: {
                file: image.path,
                error: error instanceof Error ? error.message : 'Error desconocido'
              }
            })
          }
        }

        // Enviar evento de completado
        await sendEvent({
          type: 'complete',
          data: {
            processed,
            total,
            errors
          }
        })

      } catch (error) {
        console.error('Error en procesamiento:', error)
        await sendEvent({
          type: 'error',
          data: {
            error: error instanceof Error ? error.message : 'Error desconocido'
          }
        })
      } finally {
        await writer.close()
      }
    }

    // Iniciar procesamiento
    processImages()

    return response
  } catch (error) {
    console.error('Error en endpoint:', error)
    return NextResponse.json(
      { error: 'Error iniciando reprocesamiento' },
      { status: 500 }
    )
  }
}