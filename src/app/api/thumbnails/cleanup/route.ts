import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const writeEvent = async (event: string, data: any) => {
    await writer.write(encoder.encode(JSON.stringify({ type: event, data }) + '\n'))
  }

  try {
    // Obtener imágenes con thumbnail
    const images = await prisma.image.findMany({
      where: {
        thumbnail: { not: null }
      },
      select: {
        id: true,
        path: true,
        thumbnail: true
      }
    })

    const total = images.length
    let current = 0
    let cleaned = 0

    // Procesar cada imagen
    for (const image of images) {
      current++
      const progress = Math.round((current / total) * 100)

      try {
        // Verificar si el archivo original existe
        if (!existsSync(image.path)) {
          // Si el archivo original no existe, eliminar el thumbnail
          await prisma.image.update({
            where: { id: image.id },
            data: {
              thumbnail: null,
              thumbnailWidth: null,
              thumbnailHeight: null,
              thumbnailError: 'Original file not found',
              thumbnailErrorAt: new Date()
            }
          })

          cleaned++
          await writeEvent('progress', {
            current,
            total,
            progress,
            currentFile: image.path,
            status: `Limpiando imagen ${current} de ${total}`
          })
        }
      } catch (error) {
        console.error('Error limpiando imagen:', error)
        await writeEvent('error', {
          file: image.path,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    // Enviar evento de completado
    await writeEvent('complete', {
      processed: current,
      cleaned,
      total
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
    console.error('Error en limpieza:', error)
    await writer.close()
    return NextResponse.json(
      { error: 'Error al limpiar las miniaturas' },
      { status: 500 }
    )
  }
}