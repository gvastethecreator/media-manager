import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fsService } from '@/services/fs.server'
import path from 'path'
import { getImageMetadata } from '@/lib/image'
import { computeHash } from '@/lib/hash'
import { generateThumbnail } from '@/lib/thumbnail'
import { ThumbnailQuality } from '@/services/thumbnail.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface ProgressEvent {
  type: 'progress'
  data: {
    current: number
    total: number
    progress: number
    currentFile: string
    status: string
  }
}

interface ErrorEvent {
  type: 'error'
  data: {
    file?: string
    error: string
  }
}

interface CompleteEvent {
  type: 'complete'
  data: {
    folder: {
      id: string
      path: string
      name: string
      totalSize: number
      _count: { images: number }
      errors: number
    }
  }
}

type Event = ProgressEvent | ErrorEvent | CompleteEvent

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  const writeEvent = async (event: Event) => {
    try {
      if (!event) {
        console.error('❌ Error: Evento nulo')
        return
      }

      if (typeof event !== 'object') {
        console.error('❌ Error: Evento no es un objeto:', event)
        return
      }

      if (!event.type || !event.data) {
        console.error('❌ Error: Evento inválido:', event)
        return
      }

      // Validar la estructura del evento según su tipo
      let isValid = true
      switch (event.type) {
        case 'progress':
          isValid = typeof event.data.progress === 'number' &&
            typeof event.data.current === 'number' &&
            typeof event.data.total === 'number' &&
            typeof event.data.currentFile === 'string' &&
            typeof event.data.status === 'string'
          break

        case 'error':
          isValid = typeof event.data.error === 'string'
          break

        case 'complete':
          isValid = event.data.folder &&
            typeof event.data.folder.id === 'string' &&
            typeof event.data.folder.path === 'string' &&
            typeof event.data.folder.name === 'string' &&
            typeof event.data.folder.totalSize === 'number' &&
            typeof event.data.folder._count?.images === 'number' &&
            typeof event.data.folder.errors === 'number'
          break

        default:
          isValid = false
      }

      if (!isValid) {
        console.error('❌ Error: Datos de evento inválidos:', {
          type: event.type,
          data: event.data
        })
        return
      }

      const data = encoder.encode(JSON.stringify(event) + '\n')
      await writer.write(data)
    } catch (error) {
      console.error('❌ Error escribiendo evento:', {
        error: error instanceof Error ? error.message : error,
        event
      })
    }
  }

  try {
    const id = await Promise.resolve(context.params.id)

    // Obtener la carpeta
    const folder = await prisma.folder.findUnique({
      where: { id }
    })

    if (!folder) {
      throw new Error('Carpeta no encontrada')
    }

    // Validar que la carpeta existe en el sistema de archivos
    const validation = await fsService.validatePath(folder.path)
    if (!validation.valid) {
      throw new Error(validation.error || 'La carpeta no es accesible')
    }

    // Obtener la configuración de la solicitud
    const body = await request.json().catch(() => ({}))
    const thumbnailQuality = (body?.thumbnailQuality || 'mid') as ThumbnailQuality
    const generateThumbnails = body?.generateThumbnails !== false

    // Iniciar el proceso de reindexación
    const processPromise = (async () => {
      try {
        // Leer los archivos de la carpeta
        const files = await fsService.listFiles(folder.path)
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))

        console.log('Reindexing images:', imageFiles.length)

        // Enviar evento inicial
        const initialEvent: ProgressEvent = {
          type: 'progress',
          data: {
            current: 0,
            total: imageFiles.length,
            progress: 0,
            currentFile: '',
            status: 'Iniciando reindexación...'
          }
        }
        await writeEvent(initialEvent)

        let totalSize = 0
        let processedFiles = 0
        let errors = 0

        // Procesar cada archivo
        for (const file of imageFiles) {
          try {
            // Enviar evento de progreso
            const progressEvent: ProgressEvent = {
              type: 'progress',
              data: {
                current: processedFiles + 1,
                total: imageFiles.length,
                progress: Math.round(((processedFiles + 1) / imageFiles.length) * 100),
                currentFile: file.name,
                status: 'Procesando archivo...'
              }
            }
            await writeEvent(progressEvent)

            const metadata = await getImageMetadata(file.path)
            const hash = await computeHash(file.path)

            let thumbnailData = null
            if (generateThumbnails) {
              thumbnailData = await generateThumbnail(file.path, thumbnailQuality)
            }

            // Actualizar o crear la imagen en la base de datos
            await prisma.image.upsert({
              where: {
                path_folderId: {
                  path: file.path,
                  folderId: folder.id
                }
              },
              update: {
                hash,
                size: file.size,
                width: metadata.width,
                height: metadata.height,
                thumbnail: thumbnailData?.buffer || null,
                thumbnailWidth: thumbnailData?.width || null,
                thumbnailHeight: thumbnailData?.height || null,
                thumbnailSize: thumbnailData?.buffer?.length || null,
                updatedAt: new Date()
              },
              create: {
                hash,
                name: file.name,
                path: file.path,
                size: file.size,
                width: metadata.width,
                height: metadata.height,
                thumbnail: thumbnailData?.buffer || null,
                thumbnailWidth: thumbnailData?.width || null,
                thumbnailHeight: thumbnailData?.height || null,
                thumbnailSize: thumbnailData?.buffer?.length || null,
                folderId: folder.id
              }
            })

            totalSize += file.size
            processedFiles++

            // Pequeña pausa para evitar sobrecarga
            await new Promise(resolve => setTimeout(resolve, 50))

          } catch (error) {
            errors++
            console.error('Error procesando archivo:', {
              file: file.path,
              error: error instanceof Error ? error.message : error
            })

            const errorEvent: ErrorEvent = {
              type: 'error',
              data: {
                file: file.name,
                error: error instanceof Error
                  ? error.message
                  : typeof error === 'string'
                    ? error
                    : 'Error desconocido procesando archivo'
              }
            }

            try {
              await writeEvent(errorEvent)
            } catch (writeError) {
              console.error('Error escribiendo evento:', {
                originalError: error,
                writeError
              })
            }

            // Continuar con el siguiente archivo
            continue
          }
        }

        // Actualizar estadísticas de la carpeta
        const updatedFolder = await prisma.folder.update({
          where: { id: folder.id },
          data: {
            totalSize,
            lastIndexed: new Date()
          },
          include: {
            _count: {
              select: { images: true }
            }
          }
        })

        // Enviar evento de completado
        const completeEvent: CompleteEvent = {
          type: 'complete',
          data: {
            folder: {
              id: updatedFolder.id,
              path: updatedFolder.path,
              name: path.basename(updatedFolder.path),
              totalSize: updatedFolder.totalSize,
              _count: { images: updatedFolder._count.images },
              errors
            }
          }
        }
        await writeEvent(completeEvent)

      } catch (error) {
        console.error('Error reindexando carpeta:', {
          folder: folder.path,
          error: error instanceof Error ? error.message : error
        })

        const errorEvent: ErrorEvent = {
          type: 'error',
          data: {
            error: error instanceof Error
              ? error.message
              : 'Error reindexando carpeta'
          }
        }
        await writeEvent(errorEvent)
      } finally {
        await writer.close()
      }
    })()

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('Error initializing reindex:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
