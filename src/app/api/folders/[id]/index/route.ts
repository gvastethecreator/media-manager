import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { existsSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import { generateThumbnail } from '@/lib/thumbnail'
import { getImageMetadata } from '@/lib/metadata'
import { computeHash } from '@/lib/hash'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Preparar respuesta SSE
  const response = new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  })

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

  // Procesar en background
  const processFolder = async () => {
    try {
      const folderId = context.params.id
      console.log('Iniciando indexación para carpeta:', folderId)

      // Verificar que la carpeta existe
      const folder = await prisma.folder.findUnique({
        where: { id: folderId }
      })

      if (!folder) {
        console.error('Carpeta no encontrada:', folderId)
        await sendEvent('error', {
          type: 'FOLDER_NOT_FOUND',
          message: 'Carpeta no encontrada'
        })
        return
      }

      if (!existsSync(folder.path)) {
        console.error('Carpeta no encontrada en el sistema:', folder.path)
        await sendEvent('error', {
          type: 'PATH_NOT_FOUND',
          message: 'Carpeta no encontrada en el sistema'
        })
        return
      }

      // Eliminar imágenes existentes
      await prisma.image.deleteMany({
        where: { folderId }
      })

      // Procesar archivos
      const processDirectory = async (dirPath: string): Promise<{ processed: number; total: number }> => {
        try {
          const files = await readdir(dirPath)
          let processed = 0
          let total = 0

          // Contar archivos primero
          for (const file of files) {
            const filePath = join(dirPath, file)
            const stats = await stat(filePath)

            if (stats.isDirectory()) {
              const subDirStats = await processDirectory(filePath)
              total += subDirStats.total
              continue
            }

            const ext = extname(file).toLowerCase()
            if (SUPPORTED_FORMATS.includes(ext)) {
              total++
            }
          }

          // Enviar total inicial
          await sendEvent('progress', {
            status: `Encontrados ${total} archivos para procesar...`,
            current: 0,
            total,
            progress: 0
          })

          // Procesar archivos
          for (const file of files) {
            try {
              const filePath = join(dirPath, file)
              const stats = await stat(filePath)

              if (stats.isDirectory()) {
                const subDirStats = await processDirectory(filePath)
                processed += subDirStats.processed
                continue
              }

              const ext = extname(file).toLowerCase()
              if (!SUPPORTED_FORMATS.includes(ext)) {
                continue
              }

              // Enviar progreso
              await sendEvent('progress', {
                status: 'Procesando archivos...',
                current: processed + 1,
                total,
                progress: ((processed + 1) / total) * 100,
                currentFile: filePath
              })

              // Obtener metadata y hash
              const metadata = await getImageMetadata(filePath)
              const hash = await computeHash(filePath)

              // Asegurarnos de que tenemos las dimensiones
              if (!metadata.dimensions?.width || !metadata.dimensions?.height) {
                console.warn('No se pudieron obtener las dimensiones de la imagen:', {
                  file: filePath,
                  metadata
                })
                continue
              }

              // Generar thumbnail
              let thumbnailData = null
              try {
                const result = await generateThumbnail(filePath)
                if (result?.buffer) {
                  thumbnailData = {
                    data: result.buffer,
                    size: result.buffer.length,
                    width: result.width,
                    height: result.height
                  }
                }
              } catch (thumbnailError) {
                console.error('Error generando thumbnail:', {
                  file: filePath,
                  error: thumbnailError
                })
              }

              // Crear entrada en la base de datos
              await prisma.image.create({
                data: {
                  path: filePath,
                  name: file,
                  size: metadata.fileSystem?.size || 0,
                  hash,
                  width: metadata.dimensions.width,
                  height: metadata.dimensions.height,
                  metadata: JSON.stringify(metadata),
                  thumbnail: thumbnailData?.data,
                  thumbnailSize: thumbnailData?.size,
                  thumbnailWidth: thumbnailData?.width,
                  thumbnailHeight: thumbnailData?.height,
                  folderId: folder.id,
                  createdAt: metadata.fileSystem?.created ? new Date(metadata.fileSystem.created) : new Date(),
                  updatedAt: metadata.fileSystem?.modified ? new Date(metadata.fileSystem.modified) : new Date()
                }
              })

              processed++
            } catch (fileError) {
              console.error('Error procesando archivo:', {
                file,
                path: dirPath,
                error: fileError instanceof Error ? fileError.message : 'Error desconocido'
              })
            }
          }

          return { processed, total }
        } catch (dirError) {
          console.error('Error procesando directorio:', {
            path: dirPath,
            error: dirError instanceof Error ? dirError.message : 'Error desconocido'
          })
          return { processed: 0, total: 0 }
        }
      }

      // Procesar la carpeta
      console.log('Iniciando procesamiento de directorio:', folder.path)
      const { processed, total } = await processDirectory(folder.path)

      // Actualizar estadísticas de la carpeta
      const stats = await prisma.image.aggregate({
        where: { folderId: folder.id },
        _sum: { size: true },
        _count: true
      })

      const updatedFolder = await prisma.folder.update({
        where: { id: folder.id },
        data: {
          totalFiles: stats._count,
          totalSize: stats._sum.size || 0,
          lastIndexed: new Date()
        }
      })

      // Enviar evento de completado
      console.log('Procesamiento completado:', { processed, total })
      await sendEvent('complete', {
        folder: updatedFolder,
        stats: {
          processed,
          total,
          totalSize: stats._sum.size || 0
        }
      })

    } catch (error) {
      console.error('Error en indexación:', error)
      await sendEvent('error', {
        type: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      try {
        await writer.close()
      } catch (error) {
        console.error('Error cerrando writer:', error)
      }
    }
  }

  // Iniciar procesamiento en background
  processFolder().catch(error => {
    console.error('Error fatal en processFolder:', error)
  })

  return response
}
