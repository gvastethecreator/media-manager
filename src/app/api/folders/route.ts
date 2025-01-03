import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getImageMetadata } from '@/lib/image'
import { writeStreamEvent } from '@/lib/stream'
import { computeHash } from '@/lib/hash'
import { existsSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import { generateThumbnail } from '@/lib/thumbnail'
import { ThumbnailQuality } from '@/services/thumbnail.service'

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']

export async function POST(request: NextRequest) {
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
    const { path, thumbnailQuality = 'mid', generateThumbnails = true } = await request.json()

    if (!path || !existsSync(path)) {
      throw new Error('La ruta especificada no existe')
    }

    // Verificar si la carpeta ya existe
    const existingFolder = await prisma.folder.findFirst({
      where: { path }
    })

    if (existingFolder) {
      throw new Error('FOLDER_EXISTS')
    }

    // Crear carpeta en la base de datos
    const folder = await prisma.folder.create({
      data: {
        path,
        name: path.split('\\').pop() || path,
        lastIndexed: new Date()
      }
    })

    // Función recursiva para procesar archivos
    async function processDirectory(dirPath: string): Promise<void> {
      const files = await readdir(dirPath)
      let processed = 0
      const total = files.length

      for (const file of files) {
        try {
          const filePath = join(dirPath, file)
          const stats = await stat(filePath)

          if (stats.isDirectory()) {
            await processDirectory(filePath)
            continue
          }

          const ext = extname(file).toLowerCase()
          if (!SUPPORTED_FORMATS.includes(ext)) {
            continue
          }

          processed++
          const progress = Math.round((processed / total) * 100)

          await writeEvent('progress', {
            current: processed,
            total,
            progress,
            currentFile: filePath,
            status: 'Procesando archivo...'
          })

          // Obtener metadata y hash
          const metadata = await getImageMetadata(filePath)
          const hash = await computeHash(filePath)

          // Generar thumbnail si está habilitado
          let thumbnailData = null
          if (generateThumbnails) {
            try {
              const result = await generateThumbnail(filePath, thumbnailQuality as ThumbnailQuality)
              if (result && result.buffer) {
                thumbnailData = {
                  data: Buffer.from(result.buffer).toString('base64'),
                  size: result.buffer.length,
                  width: result.width,
                  height: result.height
                }
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
              console.error('Error generando thumbnail:', { error: errorMessage, path: filePath })
              await writeEvent('error', {
                file: filePath,
                error: errorMessage
              })
            }
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
              thumbnailQuality,
              folderId: folder.id,
              createdAt: stats.birthtime,
              updatedAt: stats.mtime
            }
          })

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
          console.error('Error procesando archivo:', { error: errorMessage, file })
          await writeEvent('error', {
            file: file,
            error: errorMessage
          })
        }
      }
    }

    // Iniciar procesamiento
    await processDirectory(path)

    // Actualizar estadísticas de la carpeta
    const stats = await prisma.image.aggregate({
      where: { folderId: folder.id },
      _sum: { size: true },
      _count: true
    })

    await prisma.folder.update({
      where: { id: folder.id },
      data: {
        totalFiles: stats._count,
        totalSize: stats._sum.size || 0,
        lastIndexed: new Date()
      }
    })

    // Enviar evento de completado
    await writeEvent('complete', {
      folder: {
        id: folder.id,
        path: folder.path,
        totalFiles: stats._count,
        totalSize: stats._sum.size || 0
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
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error procesando carpeta:', { error: errorMessage })

    try {
      if (errorMessage === 'FOLDER_EXISTS') {
        await writeEvent('error', {
          code: 'FOLDER_EXISTS',
          error: 'La carpeta ya existe en el índice'
        })
      } else if (error.code === 'P2002') {
        await writeEvent('error', {
          code: 'FOLDER_EXISTS',
          error: 'La carpeta ya existe en el índice'
        })
      } else {
        await writeEvent('error', {
          code: 'UNKNOWN_ERROR',
          error: errorMessage
        })
      }
    } catch (streamError) {
      const streamErrorMessage = streamError instanceof Error ? streamError.message : 'Error desconocido'
      console.error('Error escribiendo en stream:', { error: streamErrorMessage })
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const sort = searchParams.get('sort') || 'updatedAt'
    const order = searchParams.get('order') || 'desc'

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { path: { contains: search } }
        ]
      }),
      ...(status && { status })
    }

    const folders = await prisma.folder.findMany({
      where,
      include: {
        _count: {
          select: { images: true }
        }
      },
      orderBy: { [sort]: order }
    })

    return NextResponse.json(folders)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar la conexión a la base de datos
    await prisma.$connect()

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('id')

    if (!folderId) {
      return NextResponse.json(
        { error: 'ID de carpeta no proporcionado' },
        { status: 400 }
      )
    }

    // Verificar que la carpeta existe
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    })

    if (!folder) {
      return NextResponse.json(
        { error: 'Carpeta no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar la carpeta y sus imágenes (en cascada)
    await prisma.folder.delete({
      where: { id: folderId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en DELETE /api/folders:', error)

    // Verificar si es un error de Prisma
    if (error.code === 'P1001') {
      return NextResponse.json(
        { error: 'Database connection error', details: error.message },
        { status: 503 }
      )
    }

    // Para otros errores de Prisma
    if (error.code?.startsWith('P')) {
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      )
    }

    // Error genérico
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  } finally {
    // Asegurarse de desconectar
    await prisma.$disconnect()
  }
}
