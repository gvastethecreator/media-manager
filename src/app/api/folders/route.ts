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
import { fsService } from '@/services/fs.server'

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

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

  try {
    const { path, thumbnailQuality = 'mid', generateThumbnails = true } = await request.json()

    if (!path) {
      throw new Error('PATH_REQUIRED')
    }

    // Validar y normalizar la ruta
    const normalizedPath = fsService.normalizePath(path)
    console.log('Path normalizado:', { original: path, normalized: normalizedPath })

    if (!existsSync(normalizedPath)) {
      throw new Error('PATH_NOT_FOUND')
    }

    // Verificar si la carpeta ya existe
    const existingFolder = await prisma.folder.findFirst({
      where: { path: normalizedPath }
    })

    if (existingFolder) {
      throw new Error('FOLDER_EXISTS')
    }

    // Crear carpeta en la base de datos
    const folder = await prisma.folder.create({
      data: {
        path: normalizedPath,
        name: normalizedPath.split('\\').pop() || normalizedPath,
        lastIndexed: new Date()
      }
    })

    console.log('Carpeta creada:', folder)
    await sendEvent('progress', {
      status: 'Carpeta creada, iniciando indexación...',
      current: 0,
      total: 0,
      progress: 0
    })

    // Función recursiva para procesar archivos
    async function processDirectory(dirPath: string): Promise<{ processed: number; total: number }> {
      console.log('Procesando directorio:', dirPath)
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
        current: 0,
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

          processed++
          const progress = Math.round((processed / total) * 100)

          console.log('Procesando archivo:', {
            file: filePath,
            progress,
            processed,
            total
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
                  data: result.buffer.toString('base64'),
                  size: result.buffer.length,
                  width: result.width,
                  height: result.height
                }
              }
            } catch (error) {
              console.error('Error generando thumbnail:', error)
              await sendEvent('error', {
                type: 'THUMBNAIL_ERROR',
                message: error instanceof Error ? error.message : 'Error desconocido',
                file: filePath
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
              folderId: folder.id,
              createdAt: stats.birthtime,
              updatedAt: stats.mtime
            }
          })

          await sendEvent('progress', {
            current: processed,
            total,
            progress,
            currentFile: filePath,
            status: `Procesando archivo ${processed} de ${total}...`
          })

          console.log('Archivo procesado:', filePath)

        } catch (error) {
          console.error('Error procesando archivo:', error)
          await sendEvent('error', {
            type: 'PROCESS_ERROR',
            message: error instanceof Error ? error.message : 'Error desconocido',
            file: file
          })
        }
      }

      return { processed, total }
    }

    // Iniciar procesamiento
    console.log('Iniciando procesamiento de directorio:', normalizedPath)
    const { processed, total } = await processDirectory(normalizedPath)

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
    console.log('Procesamiento completado:', { processed, total })
    await sendEvent('complete', {
      folder: {
        id: folder.id,
        path: folder.path,
        totalFiles: stats._count,
        totalSize: stats._sum.size || 0,
        processed,
        total
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

    return response

  } catch (error) {
    console.error('Error procesando carpeta:', error)

    try {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      const errorType =
        errorMessage === 'FOLDER_EXISTS' ? 'FOLDER_EXISTS' :
          errorMessage === 'PATH_REQUIRED' ? 'PATH_REQUIRED' :
            errorMessage === 'PATH_NOT_FOUND' ? 'PATH_NOT_FOUND' :
              'UNKNOWN_ERROR'

      await sendEvent('error', {
        type: errorType,
        message: errorMessage
      })

      // Preparar respuesta de error
      const response = new NextResponse(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })

      return response
    } catch (streamError) {
      console.error('Error escribiendo en stream:', streamError)
      return new NextResponse(null, { status: 500 })
    }
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
