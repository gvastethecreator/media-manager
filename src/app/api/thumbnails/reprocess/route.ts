import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeStreamEvent } from '@/lib/stream'
import { generateThumbnail } from '@/lib/image'
import { existsSync } from 'fs'

export async function POST() {
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  try {
    // Obtener todas las imágenes que necesitan reprocesar
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
        thumbnailQuality: true
      }
    })

    const total = images.length
    if (total === 0) {
      await writeStreamEvent(writer, 'complete', { processed: 0, total: 0 })
      await writer.close()
      return new NextResponse(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }

    let current = 0
    let errors = 0

    // Procesar cada imagen
    for (const image of images) {
      try {
        current++
        const progress = Math.round((current / total) * 100)

        // Verificar que el archivo existe
        if (!existsSync(image.path)) {
          errors++
          await writeStreamEvent(writer, 'error', {
            file: image.path,
            error: 'Archivo original no encontrado'
          })
          continue
        }

        await writeStreamEvent(writer, 'progress', {
          current,
          total,
          progress,
          currentFile: image.path,
          status: 'Procesando...'
        })

        // Generar thumbnail
        const result = await generateThumbnail(image.path, image.thumbnailQuality || 'mid')
        if (!result) {
          throw new Error('Error generando miniatura')
        }

        // Actualizar en base de datos
        await prisma.image.update({
          where: { id: image.id },
          data: {
            thumbnail: result.data,
            thumbnailSize: result.size,
            thumbnailWidth: result.width,
            thumbnailHeight: result.height,
            thumbnailError: null,
            thumbnailErrorAt: null,
            updatedAt: new Date()
          }
        })

      } catch (error) {
        errors++
        console.error('Error procesando imagen:', error)

        // Actualizar error en base de datos
        await prisma.image.update({
          where: { id: image.id },
          data: {
            thumbnailError: error instanceof Error ? error.message : 'Error desconocido',
            thumbnailErrorAt: new Date()
          }
        })

        // Enviar evento de error
        await writeStreamEvent(writer, 'error', {
          file: image.path,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    // Enviar evento de completado
    await writeStreamEvent(writer, 'complete', {
      processed: current - errors,
      total,
      errors
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
    console.error('Error en reprocesamiento:', error)

    try {
      await writeStreamEvent(writer, 'error', {
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    } catch (streamError) {
      console.error('Error escribiendo en stream:', streamError)
    }

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