import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeStreamEvent } from '@/lib/stream'
import { generateThumbnail } from '@/lib/thumbnail'
import { existsSync } from 'fs'
import { ThumbnailQuality } from '@/services/thumbnail.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface ReindexError extends Error {
  code?: string;
  details?: any;
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const writeEvent = async (event: string, data: Record<string, any>) => {
    try {
      const formattedData = JSON.stringify({ type: event, data })
      await writer.write(encoder.encode(`data: ${formattedData}\n\n`))
    } catch (writeError) {
      // Solo logueamos el mensaje del error para evitar problemas con console.error
      console.log('Error escribiendo evento:', writeError?.message || 'Error desconocido')
    }
  }

  try {
    const params = await Promise.resolve(context.params)
    const { id } = params

    if (!id) {
      const error: ReindexError = new Error('ID de carpeta requerido')
      error.code = 'ID_REQUIRED'
      throw error
    }

    const { generateThumbnails = true, thumbnailQuality = 'mid' } = await request.json().catch(() => ({}))

    // Obtener la carpeta
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        images: {
          select: {
            id: true,
            path: true
          }
        }
      }
    })

    if (!folder) {
      const error: ReindexError = new Error('Carpeta no encontrada')
      error.code = 'FOLDER_NOT_FOUND'
      throw error
    }

    const total = folder.images.length
    let current = 0
    let errors = 0

    // Enviar evento inicial
    await writeEvent('progress', {
      current: 0,
      total,
      progress: 0,
      status: 'Iniciando reindexación...'
    })

    // Procesar cada imagen
    for (const image of folder.images) {
      try {
        current++
        const progress = Math.round((current / total) * 100)

        // Verificar que el archivo existe
        if (!existsSync(image.path)) {
          errors++
          await writeEvent('error', {
            type: 'FILE_NOT_FOUND',
            message: 'Archivo original no encontrado',
            file: image.path
          })
          continue
        }

        await writeEvent('progress', {
          current,
          total,
          progress,
          currentFile: image.path,
          status: 'Procesando...'
        })

        if (generateThumbnails) {
          try {
            // Generar thumbnail con reintentos
            let attempts = 0
            const maxAttempts = 3
            let lastError: Error | null = null

            while (attempts < maxAttempts) {
              try {
                const result = await generateThumbnail(image.path, thumbnailQuality as ThumbnailQuality)

                // Actualizar en base de datos
                await prisma.image.update({
                  where: { id: image.id },
                  data: {
                    thumbnail: result.buffer.toString('base64'),
                    thumbnailSize: result.buffer.length,
                    thumbnailWidth: result.width,
                    thumbnailHeight: result.height,
                    thumbnailQuality: thumbnailQuality,
                    thumbnailError: null,
                    thumbnailErrorAt: null,
                    updatedAt: new Date()
                  }
                })

                break // Si llegamos aquí, el thumbnail se generó correctamente
              } catch (thumbnailError) {
                lastError = thumbnailError instanceof Error ? thumbnailError : new Error('Error desconocido')
                attempts++

                if (attempts < maxAttempts) {
                  console.log(`Reintentando generación (${attempts}/${maxAttempts})...`)
                  await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
                } else {
                  throw lastError
                }
              }
            }
          } catch (thumbnailError) {
            errors++
            console.log('Error generando thumbnail:', thumbnailError?.message || 'Error desconocido')

            // Actualizar error en base de datos
            await prisma.image.update({
              where: { id: image.id },
              data: {
                thumbnailError: thumbnailError instanceof Error ? thumbnailError.message : 'Error desconocido',
                thumbnailErrorAt: new Date(),
                thumbnail: null,
                thumbnailSize: null,
                thumbnailWidth: null,
                thumbnailHeight: null
              }
            })

            await writeEvent('error', {
              type: 'THUMBNAIL_ERROR',
              message: thumbnailError instanceof Error ? thumbnailError.message : 'Error desconocido',
              file: image.path
            })
          }
        }
      } catch (processError) {
        errors++
        console.log('Error procesando imagen:', processError?.message || 'Error desconocido')

        await writeEvent('error', {
          type: 'PROCESS_ERROR',
          message: processError instanceof Error ? processError.message : 'Error desconocido',
          file: image.path
        })
      }
    }

    // Actualizar estadísticas de la carpeta
    await prisma.folder.update({
      where: { id },
      data: {
        lastIndexed: new Date()
      }
    })

    // Enviar evento de completado
    await writeEvent('complete', {
      processed: current - errors,
      total,
      errors,
      folder: {
        id: folder.id,
        name: folder.name,
        path: folder.path,
        errors
      }
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
    // Evitamos usar console.error directamente con el objeto error
    console.log('Error en reindexación:', error instanceof Error ? error.message : 'Error desconocido')

    try {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      const errorCode = (error as ReindexError).code || 'UNKNOWN_ERROR'

      await writeEvent('error', {
        type: errorCode,
        message: errorMessage
      })
    } catch (streamError) {
      console.log('Error escribiendo en stream:', streamError instanceof Error ? streamError.message : 'Error desconocido')
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
