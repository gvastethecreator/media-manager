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
    // Obtener todas las imágenes
    const images = await prisma.image.findMany({
      select: {
        id: true,
        path: true,
        thumbnail: true,
        thumbnailError: true
      }
    })

    const total = images.length
    let current = 0
    let invalid = 0

    // Procesar cada imagen
    for (const image of images) {
      current++
      const progress = Math.round((current / total) * 100)

      try {
        let isValid = true
        let error = null

        // Verificar que el archivo original existe
        if (!existsSync(image.path)) {
          isValid = false
          error = 'Original file not found'
        }

        // Verificar que tiene thumbnail o error
        if (!image.thumbnail && !image.thumbnailError) {
          isValid = false
          error = 'Missing thumbnail and no error recorded'
        }

        // Si no es válido, actualizar en base de datos
        if (!isValid) {
          await prisma.image.update({
            where: { id: image.id },
            data: {
              thumbnailError: error,
              thumbnailErrorAt: new Date()
            }
          })

          invalid++
          await writeEvent('progress', {
            current,
            total,
            progress,
            currentFile: image.path,
            status: `Validando imagen ${current} de ${total}`
          })
        }
      } catch (error) {
        console.error('Error validando imagen:', error)
        await writeEvent('error', {
          file: image.path,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    // Enviar evento de completado
    await writeEvent('complete', {
      processed: current,
      invalid,
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
    console.error('Error en validación:', error)
    await writer.close()
    return NextResponse.json(
      { error: 'Error al validar las miniaturas' },
      { status: 500 }
    )
  }
}