import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { getImageMetadata } from '@/lib/image'
import { computeHash } from '@/lib/hash'
import { existsSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import { ThumbnailQuality } from '@/services/thumbnail.service'

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    console.log('Iniciando reindexación de carpeta:', id)

    if (!id) {
      return NextResponse.json({ error: 'ID de carpeta requerido' }, { status: 400 })
    }

    // Obtener la carpeta
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        _count: {
          select: { images: true }
        }
      }
    })

    if (!folder) {
      return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 })
    }

    if (!existsSync(folder.path)) {
      return NextResponse.json({ error: 'Carpeta no encontrada en el sistema' }, { status: 404 })
    }

    console.log('Carpeta encontrada:', {
      id: folder.id,
      path: folder.path,
      imageCount: folder._count.images
    })

    // Eliminar imágenes existentes
    await prisma.image.deleteMany({
      where: { folderId: id }
    })

    // Función recursiva para procesar archivos
    async function processDirectory(dirPath: string): Promise<{ processed: number; errors: number }> {
      let processed = 0
      let errors = 0

      try {
        const files = await readdir(dirPath)

        for (const file of files) {
          try {
            const filePath = join(dirPath, file)
            const stats = await stat(filePath)

            if (stats.isDirectory()) {
              const subDirStats = await processDirectory(filePath)
              processed += subDirStats.processed
              errors += subDirStats.errors
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
              console.error('Error generando thumbnail:', {
                file: filePath,
                error: thumbnailError
              })
              errors++
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
            console.log('Archivo procesado:', {
              file: filePath,
              processed
            })

          } catch (fileError) {
            console.error('Error procesando archivo:', {
              file: file,
              error: fileError
            })
            errors++
          }
        }
      } catch (dirError) {
        console.error('Error procesando directorio:', {
          dir: dirPath,
          error: dirError
        })
        errors++
      }

      return { processed, errors }
    }

    // Procesar la carpeta
    const { processed, errors } = await processDirectory(folder.path)

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

    console.log('Reindexación completada:', {
      processed,
      errors,
      totalFiles: stats._count,
      totalSize: stats._sum.size || 0
    })

    return NextResponse.json({
      success: true,
      processed,
      errors,
      totalFiles: stats._count,
      totalSize: stats._sum.size || 0
    })

  } catch (error) {
    console.error('Error en reindexación:', error)
    return NextResponse.json(
      {
        error: 'Error en reindexación',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
