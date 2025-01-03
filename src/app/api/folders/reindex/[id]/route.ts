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

  const sendEvent = async (type: string, data: Record<string, any>) => {
    try {
      const formattedData = JSON.stringify({ type, data })
      await writer.write(encoder.encode(`data: ${formattedData}\n\n`))
    } catch (writeError) {
      console.error('Error escribiendo evento:', writeError)
      throw writeError
    }
  }

  try {
    // Esperar a que los parámetros estén disponibles
    const params = await Promise.resolve(context.params)
    console.log('Parámetros de ruta:', params)

    const { id } = params
    console.log('ID de carpeta:', id)

    if (!id) {
      const error: ReindexError = new Error('ID de carpeta requerido')
      error.code = 'ID_REQUIRED'
      throw error
    }

    // Obtener configuración del request
    const { generateThumbnails = true, thumbnailQuality = 'mid' } = await request.json().catch(() => ({}))
    console.log('Configuración:', { generateThumbnails, thumbnailQuality })

    // Obtener la carpeta
    console.log('Buscando carpeta:', id)
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
      console.log('Carpeta no encontrada:', id)
      const error: ReindexError = new Error('Carpeta no encontrada')
      error.code = 'FOLDER_NOT_FOUND'
      throw error
    }

    console.log('Carpeta encontrada:', {
      id: folder.id,
      path: folder.path,
      imageCount: folder.images.length
    })

    const total = folder.images.length
    let current = 0
    let errors = 0

    // Enviar evento inicial
    await sendEvent('progress', {
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

        console.log('Procesando imagen:', {
          id: image.id,
          path: image.path,
          progress: `${current}/${total} (${progress}%)`
        })

        // Verificar que el archivo existe
        if (!existsSync(image.path)) {
          errors++
          console.log('Archivo no encontrado:', image.path)
          await sendEvent('error', {
            type: 'FILE_NOT_FOUND',
            message: 'Archivo original no encontrado',
            file: image.path
          })
          continue
        }

        await sendEvent('progress', {
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
                console.log('Generando thumbnail:', { path: image.path, attempt: attempts + 1 })
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

                console.log('Thumbnail generado correctamente:', { id: image.id, size: result.buffer.length })
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
            console.error('Error generando thumbnail:', thumbnailError)

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

            await sendEvent('error', {
              type: 'THUMBNAIL_ERROR',
              message: thumbnailError instanceof Error ? thumbnailError.message : 'Error desconocido',
              file: image.path
            })
          }
        }
      } catch (processError) {
        errors++
        console.error('Error procesando imagen:', processError)

        await sendEvent('error', {
          type: 'PROCESS_ERROR',
          message: processError instanceof Error ? processError.message : 'Error desconocido',
          file: image.path
        })
      }
    }

    // Actualizar estadísticas de la carpeta
    console.log('Actualizando estadísticas de carpeta')
    await prisma.folder.update({
      where: { id },
      data: {
        lastIndexed: new Date()
      }
    })

    // Enviar evento de completado
    console.log('Proceso completado:', { processed: current - errors, total, errors })
    await sendEvent('complete', {
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

    // Preparar respuesta
    const response = new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

    // Cerrar el writer después de preparar la respuesta
    writer.close().catch(console.error)

    return response

  } catch (error) {
    console.error('Error en reindexación:', error)

    try {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      const errorCode = (error as ReindexError).code || 'UNKNOWN_ERROR'

      await sendEvent('error', {
        type: errorCode,
        message: errorMessage
      })
    } catch (streamError) {
      console.error('Error escribiendo en stream:', streamError)
    }

    // Preparar respuesta de error
    const response = new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

    // Cerrar el writer después de preparar la respuesta
    writer.close().catch(console.error)

    return response
  }
}
