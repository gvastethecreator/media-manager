import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { getImageMetadata } from '@/lib/image'
import { computeHash } from '@/lib/hash'
import { existsSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Preparar respuesta SSE primero
  const response = new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
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

  const processFolder = async () => {
    try {
      const { id } = context.params
      console.log('Iniciando reindexación de carpeta:', id)

      if (!id) {
        throw new Error('ID de carpeta requerido')
      }

      // Obtener la carpeta
      const folder = await prisma.folder.findUnique({
        where: { id }
      })

      if (!folder) {
        throw new Error('Carpeta no encontrada')
      }

      if (!existsSync(folder.path)) {
        throw new Error('Carpeta no encontrada en el sistema')
      }

      // Eliminar imágenes existentes
      await prisma.image.deleteMany({
        where: { folderId: id }
      })

      // Función recursiva para procesar archivos
      async function processDirectory(dirPath: string): Promise<{ processed: number; total: number }> {
        const files = await readdir(dirPath)
        let processed = 0
        let total = 0

        // Primero contar archivos válidos
        for (const file of files) {
          const filePath = join(dirPath, file)
          const stats = await stat(filePath)

          if (stats.isDirectory()) {
            const subDirStats = await processDirectory(filePath)
            total += subDirStats.total
          } else {
            const ext = extname(file).toLowerCase()
            if (SUPPORTED_FORMATS.includes(ext)) {
              total++
            }
          }
        }

        // Enviar evento con el total inicial
        await sendEvent('progress', {
          current: processed,
          total,
          progress: 0,
          status: `Encontrados ${total} archivos para procesar...`
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

            // Obtener metadata y hash
            const metadata = await getImageMetadata(filePath)
            const hash = await computeHash(filePath)

            // Generar thumbnail
            let thumbnailData = null
            try {
              const result = await generateThumbnail(filePath, 'mid')
              if (result && result.buffer) {
                thumbnailData = {
                  data: result.buffer.toString('base64'),
                  size: result.buffer.length,
                  width: result.width,
                  height: result.height
                }
              }
            } catch (thumbnailError) {
              console.error('Error generando thumbnail:', thumbnailError)
            }

            // Crear entrada en la base de datos
            await prisma.image.create({
              data: {
                path: filePath,
                name: file,
                size: stats.size,
                hash,
                width: metadata.width,
                height: metadata.height,
                metadata: JSON.stringify(metadata),
                thumbnail: thumbnailData?.data ? Buffer.from(thumbnailData.data, 'base64') : null,
                thumbnailSize: thumbnailData?.size,
                thumbnailWidth: thumbnailData?.width,
                thumbnailHeight: thumbnailData?.height,
                folderId: folder.id,
                createdAt: stats.birthtime,
                updatedAt: stats.mtime
              }
            })

            processed++
            const progress = Math.round((processed / total) * 100)

            await sendEvent('progress', {
              current: processed,
              total,
              progress,
              currentFile: filePath,
              status: `Procesando archivo ${processed} de ${total}...`
            })

          } catch (error) {
            console.error('Error procesando archivo:', error)
            await sendEvent('error', {
              file: file,
              error: error instanceof Error ? error.message : 'Error desconocido'
            })
          }
        }

        return { processed, total }
      }

      // Procesar la carpeta
      const { processed, total } = await processDirectory(folder.path)

      // Actualizar estadísticas de la carpeta
      const stats = await prisma.image.aggregate({
        where: { folderId: id },
        _sum: { size: true },
        _count: true
      })

      await prisma.folder.update({
        where: { id },
        data: {
          totalFiles: stats._count,
          totalSize: stats._sum.size || 0,
          lastIndexed: new Date()
        }
      })

      // Enviar evento de completado
      await sendEvent('complete', {
        processed,
        total,
        errors: total - processed,
        folder: {
          id: folder.id,
          name: folder.name,
          path: folder.path,
          totalFiles: stats._count,
          totalSize: stats._sum.size || 0
        }
      })

    } catch (error) {
      console.error('Error en reindexación:', error)
      await sendEvent('error', {
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      await writer.close()
    }
  }

  // Iniciar procesamiento en background
  processFolder()

  return response
}

