import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import { getImageMetadata } from '@/lib/image'
import { computeHash } from '@/lib/hash'
import { generateThumbnail } from '@/lib/thumbnail'
import { fsService } from '@/services/fs.server'
import { ThumbnailQuality } from '@/services/thumbnail.service'
import { readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { path: folderPath, thumbnailQuality = 'mid', generateThumbnails = true } = await request.json()

    if (!folderPath) {
      return NextResponse.json({ error: 'Se requiere una ruta de carpeta' }, { status: 400 })
    }

    // Validar la ruta de la carpeta
    const validation = await fsService.validatePath(folderPath)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Configurar el stream de respuesta
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    const encoder = new TextEncoder()

    const writeEvent = async (payload: { type: string; data: any }) => {
      if (!payload || typeof payload !== 'object') {
        console.error('Invalid payload:', payload)
        return
      }

      try {
        await writer.write(encoder.encode(JSON.stringify(payload) + '\n'))
      } catch (error) {
        console.error('Error writing event:', error)
      }
    }

    // Iniciar el procesamiento en segundo plano
    const processPromise = (async () => {
      try {
        // Crear la carpeta en la base de datos
        const folder = await prisma.folder.create({
          data: {
            path: folderPath,
            name: path.basename(folderPath),
          }
        })

        // Leer los archivos de la carpeta
        const files = await fsService.listFiles(folderPath)
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))

        console.log('📸 Processing images:', imageFiles.length)

        // Enviar evento inicial
        await writeEvent({
          type: 'progress',
          data: {
            current: 0,
            total: imageFiles.length,
            progress: 0,
            currentFile: '',
            status: 'Iniciando procesamiento...'
          }
        })

        let totalSize = 0
        let processedFiles = 0

        // Procesar cada archivo
        for (const file of imageFiles) {
          try {
            // Enviar evento de progreso
            await writeEvent({
              type: 'progress',
              data: {
                current: processedFiles + 1,
                total: imageFiles.length,
                progress: Math.round(((processedFiles + 1) / imageFiles.length) * 100),
                currentFile: file.name,
                status: 'Procesando archivo...'
              }
            })

            const metadata = await getImageMetadata(file.path)
            const hash = await computeHash(file.path)

            let thumbnailData = null
            if (generateThumbnails) {
              thumbnailData = await generateThumbnail(file.path, thumbnailQuality)
            }

            // Crear entrada en la base de datos
            await prisma.image.create({
              data: {
                hash,
                name: file.name,
                path: file.path,
                size: file.size,
                width: metadata.width || 0,
                height: metadata.height || 0,
                thumbnail: thumbnailData?.buffer || null,
                thumbnailWidth: thumbnailData?.width || 0,
                thumbnailHeight: thumbnailData?.height || 0,
                folderId: folder.id,
              }
            })

            totalSize += file.size
            processedFiles++

            // Pequeña pausa para evitar sobrecarga
            await new Promise(resolve => setTimeout(resolve, 50))

          } catch (error) {
            console.error('Error processing file:', file.path, error)
            await writeEvent({
              type: 'error',
              data: {
                file: file.name,
                error: error instanceof Error ? error.message : 'Error procesando archivo'
              }
            })
          }
        }

        // Actualizar estadísticas de la carpeta
        await prisma.folder.update({
          where: { id: folder.id },
          data: {
            totalSize,
            lastIndexed: new Date()
          }
        })

        // Enviar evento de completado
        await writeEvent({
          type: 'complete',
          data: {
            folder: {
              id: folder.id,
              path: folderPath,
              name: path.basename(folderPath),
              totalSize,
              _count: { images: processedFiles }
            }
          }
        })

      } catch (error) {
        console.error('Error processing folder:', error)
        await writeEvent({
          type: 'error',
          data: {
            error: error instanceof Error ? error.message : 'Error procesando carpeta'
          }
        })
      } finally {
        await writer.close()
      }
    })()

    // Iniciar el procesamiento y devolver el stream
    processPromise.catch(console.error)
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Error in POST handler:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
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
