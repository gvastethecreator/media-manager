import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { existsSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import { generateThumbnail } from '@/lib/thumbnail'
import { getImageMetadata } from '@/lib/metadata'
import { computeHash } from '@/lib/hash'
import { logger } from '@/lib/logger'
import type { ImageMetadata } from '@/types/metadata'

const reindexLogger = logger.withContext('ReindexAPI')

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    reindexLogger.info('🔄 Iniciando reindexado para carpeta:', id)

    // Verificar que la carpeta existe
    const folder = await prisma.folder.findUnique({
      where: { id },
      select: {
        id: true,
        path: true,
        name: true,
      },
    })

    if (!folder) {
      reindexLogger.error('Carpeta no encontrada:', id)
      return NextResponse.json(
        { error: 'FOLDER_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (!existsSync(folder.path)) {
      reindexLogger.error('Carpeta no encontrada en el sistema:', folder.path)
      return NextResponse.json(
        { error: 'PATH_NOT_FOUND' },
        { status: 404 }
      )
    }

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

            // Verificar si la imagen ya existe
            const existingImage = await prisma.image.findFirst({
              where: { path: filePath }
            })

            if (!existingImage) {
              // Procesar nueva imagen
              const hash = await computeHash(filePath)
              const metadata = await getImageMetadata(filePath) as ImageMetadata

              await prisma.image.create({
                data: {
                  name: file,
                  path: filePath,
                  hash,
                  size: stats.size,
                  width: metadata.dimensions?.width || 0,
                  height: metadata.dimensions?.height || 0,
                  metadata: JSON.stringify(metadata),
                  folderId: folder.id,
                  isPublic: false
                }
              })

              // Generar thumbnail
              await generateThumbnail(filePath)
              processed++
            } else {
              // Actualizar metadata si es necesario
              const metadata = await getImageMetadata(filePath)
              await prisma.image.update({
                where: { id: existingImage.id },
                data: {
                  size: stats.size,
                  metadata: JSON.stringify(metadata),
                  updatedAt: new Date()
                }
              })
              processed++
            }
          } catch (fileError) {
            reindexLogger.error('Error procesando archivo:', {
              path: file,
              error: fileError instanceof Error ? fileError.message : 'Error desconocido'
            })
            continue
          }
        }

        return { processed, total }
      } catch (dirError) {
        reindexLogger.error('Error procesando directorio:', {
          path: dirPath,
          error: dirError instanceof Error ? dirError.message : 'Error desconocido'
        })
        return { processed: 0, total: 0 }
      }
    }

    // Procesar la carpeta
    reindexLogger.info('Iniciando procesamiento de directorio:', folder.path)
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

    reindexLogger.info('Procesamiento completado:', { processed, total })
    return NextResponse.json({
      folder: updatedFolder,
      stats: {
        processed,
        total,
        totalSize: stats._sum.size || 0
      }
    })

  } catch (error) {
    reindexLogger.error('Error en reindexación:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error desconocido',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}
