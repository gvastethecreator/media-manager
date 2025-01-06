import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { existsSync } from 'fs'

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
    // Obtener todas las imágenes con thumbnail
    const images = await prisma.image.findMany({
      where: {
        thumbnail: { not: null }
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
    let cleaned = 0
    let errors = 0
    let totalFreed = 0

    // Enviar estado inicial
    await writeEvent('start', {
      total,
      status: 'Iniciando limpieza...'
    })

    // Procesar cada imagen
    for (const image of images) {
      current++
      const progress = Math.round((current / total) * 100)

      try {
        // Verificar si el archivo original existe
        if (!existsSync(image.path)) {
          // Si el archivo original no existe, limpiar el thumbnail
          await prisma.image.update({
            where: { id: image.id },
            data: {
              thumbnail: null,
              thumbnailSize: null,
              thumbnailWidth: null,
              thumbnailHeight: null,
              thumbnailError: 'Archivo original no encontrado',
              thumbnailErrorAt: new Date()
            }
          })

          totalFreed += image.thumbnailSize || 0
          cleaned++

          await writeEvent('progress', {
            current,
            total,
            progress,
            currentFile: image.path,
            status: `Limpiando ${current} de ${total}`,
            lastProcessed: {
              id: image.id,
              path: image.path,
              processedAt: new Date().toISOString(),
              freed: image.thumbnailSize || 0
            }
          })
        }
      } catch (error) {
        console.error('Error limpiando imagen:', error)
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
      cleaned,
      errors,
      total,
      totalFreed
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
    console.error('Error en limpieza:', error)
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