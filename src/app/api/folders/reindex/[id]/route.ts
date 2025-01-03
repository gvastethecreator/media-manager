import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeStreamEvent } from '@/lib/stream'
import { generateThumbnail } from '@/lib/thumbnail'
import { existsSync } from 'fs'
import { ThumbnailQuality } from '@/services/thumbnail.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const writeEvent = async (event: string, data: Record<string, any>) => {
    try {
      const formattedData = JSON.stringify({ type: event, data })
      await writer.write(encoder.encode(`data: ${formattedData}\n\n`))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.error('Error escribiendo evento:', { error: errorMessage })
    }
  }

  try {
    if (!params?.id) {
      throw new Error('ID_REQUIRED')
    }

    const { generateThumbnails = true, thumbnailQuality = 'mid' } = await request.json().catch(() => ({}))

    // Obtener la carpeta
    const folder = await prisma.folder.findUnique({
      where: { id: params.id },
      include: {
        images: {
          select: {
            id: true,
            path: true,
            thumbnailQuality: true
          }
        }
      }
    })

    if (!folder) {
      throw new Error('FOLDER_NOT_FOUND')
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
            code: 'FILE_NOT_FOUND',
            file: image.path,
            error: 'Archivo original no encontrado'
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
              } catch (error) {
                lastError = error instanceof Error ? error : new Error('Error desconocido')
                attempts++

                if (attempts < maxAttempts) {
                  console.log(`Reintentando generación (${attempts}/${maxAttempts})...`)
                  await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
                } else {
                  throw lastError
                }
              }
            }
          } catch (error) {
            errors++
            console.error('Error generando thumbnail:', error)

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

            await writeEvent('error', {
              code: 'THUMBNAIL_ERROR',
              file: image.path,
              error: error instanceof Error ? error.message : 'Error desconocido'
            })
          }
        }
      } catch (error) {
        errors++
        console.error('Error procesando imagen:', error)

        await writeEvent('error', {
          code: 'PROCESS_ERROR',
          file: image.path,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    // Actualizar estadísticas de la carpeta
    await prisma.folder.update({
      where: { id: params.id },
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
    console.error('Error en reindexación:', error)

    try {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      const errorCode = errorMessage === 'FOLDER_NOT_FOUND' ? 'FOLDER_NOT_FOUND' :
        errorMessage === 'ID_REQUIRED' ? 'ID_REQUIRED' : 'UNKNOWN_ERROR'
      const errorDescription = {
        'FOLDER_NOT_FOUND': 'Carpeta no encontrada',
        'ID_REQUIRED': 'ID de carpeta requerido',
        'UNKNOWN_ERROR': errorMessage
      }[errorCode]

      await writeEvent('error', {
        code: errorCode,
        error: errorDescription
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
