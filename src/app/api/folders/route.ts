import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { computeHash } from '@/lib/server-utils'
import { getImageMetadata } from '@/lib/image.server'
import { THUMBNAIL_QUALITY_CONFIG, type ThumbnailQuality } from '@/services/thumbnail.service'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    // Verificar la conexión a la base de datos
    await prisma.$connect()

    const { path: folderPath, thumbnailQuality = 'mid' } = await request.json() as { path: string, thumbnailQuality?: ThumbnailQuality }
    console.log('📥 Adding folder:', { folderPath, thumbnailQuality })

    // Verificar si la carpeta existe en el sistema de archivos
    try {
      const stats = statSync(folderPath)
      if (!stats.isDirectory()) {
        return NextResponse.json(
          { error: 'La ruta no es un directorio válido' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Error verificando directorio:', error)
      return NextResponse.json(
        { error: 'No se encontró el directorio o no se tiene acceso' },
        { status: 404 }
      )
    }

    // Verificar si la carpeta ya existe en la base de datos
    const existingFolder = await prisma.folder.findUnique({
      where: { path: folderPath }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: 'La carpeta ya existe en la base de datos' },
        { status: 400 }
      )
    }

    // Crear un TransformStream para enviar actualizaciones de progreso
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    const encoder = new TextEncoder()

    // Iniciar el procesamiento en segundo plano
    const processPromise = (async () => {
      try {
        // Crear la carpeta en la base de datos
        const folder = await prisma.folder.create({
          data: {
            path: folderPath,
            name: folderPath.split('\\').pop() || folderPath,
          }
        })

        // Leer los archivos de la carpeta
        const files = readdirSync(folderPath)
          .map(file => {
            const filePath = join(folderPath, file)
            const stats = statSync(filePath)
            return {
              path: filePath,
              name: file,
              size: stats.size,
              isDirectory: stats.isDirectory()
            }
          })
          .filter(file => !file.isDirectory && /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))

        console.log('📸 Processing images:', files.length)

        let totalSize = 0
        let processedFiles = 0

        // Procesar cada archivo
        for (const file of files) {
          try {
            // Enviar evento de inicio de procesamiento del archivo
            await writer.write(encoder.encode(JSON.stringify({
              type: 'progress',
              data: {
                current: processedFiles + 1,
                total: files.length,
                progress: Math.round(((processedFiles + 1) / files.length) * 100),
                currentFile: file.name,
                status: 'Analizando metadata...'
              }
            }) + '\n'))

            const metadata = await getImageMetadata(file.path)
            const hash = await computeHash(file.path)

            // Enviar evento de generación de thumbnail
            await writer.write(encoder.encode(JSON.stringify({
              type: 'progress',
              data: {
                current: processedFiles + 1,
                total: files.length,
                progress: Math.round(((processedFiles + 1) / files.length) * 100),
                currentFile: file.name,
                status: 'Generando thumbnail...'
              }
            }) + '\n'))

            // Generar thumbnail
            const thumbnailConfig = THUMBNAIL_QUALITY_CONFIG[thumbnailQuality]
            const image = sharp(file.path)
            const metadata_thumb = await image.metadata()
            
            const resizedImage = image.resize({
              width: thumbnailConfig.width,
              height: thumbnailConfig.height,
              fit: 'inside',
              withoutEnlargement: true
            })

            const thumbnailBuffer = await resizedImage.toBuffer()

            // Guardar imagen en la base de datos
            await prisma.image.create({
              data: {
                hash,
                name: file.name,
                path: file.path,
                size: file.size,
                width: metadata.width || 0,
                height: metadata.height || 0,
                thumbnail: thumbnailBuffer,
                thumbnailWidth: metadata_thumb.width || 0,
                thumbnailHeight: metadata_thumb.height || 0,
                folderId: folder.id,
              }
            })

            totalSize += file.size
            processedFiles++

            // Enviar evento de archivo completado
            await writer.write(encoder.encode(JSON.stringify({
              type: 'progress',
              data: {
                current: processedFiles,
                total: files.length,
                progress: Math.round((processedFiles / files.length) * 100),
                currentFile: file.name,
                status: 'Completado'
              }
            }) + '\n'))

            // Pequeña pausa para que el UI pueda actualizarse
            await new Promise(resolve => setTimeout(resolve, 100))

          } catch (error) {
            console.error('Error processing file:', file.path, error)
            await writer.write(encoder.encode(JSON.stringify({
              type: 'error',
              data: {
                file: file.name,
                error: error instanceof Error ? error.message : 'Error procesando archivo'
              }
            }) + '\n'))
          }
        }

        // Actualizar el tamaño total de la carpeta
        await prisma.folder.update({
          where: { id: folder.id },
          data: {
            totalSize,
            lastIndexed: new Date()
          }
        })

        // Enviar evento de completado
        await writer.write(encoder.encode(JSON.stringify({
          type: 'complete',
          data: {
            folder: {
              ...folder,
              totalSize,
              _count: { images: processedFiles }
            }
          }
        }) + '\n'))

      } catch (error) {
        console.error('Error processing folder:', error)
        await writer.write(encoder.encode(JSON.stringify({
          type: 'error',
          data: {
            error: error instanceof Error ? error.message : 'Error procesando carpeta'
          }
        }) + '\n'))
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
    console.error('Error in POST /api/folders:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  console.log('📥 GET /api/folders - Iniciando solicitud')
  try {
    // Verificar la conexión a la base de datos
    await prisma.$connect()
    console.log('✅ Conexión a base de datos establecida')

    console.log('🔄 Consultando carpetas...')
    const folders = await prisma.folder.findMany({
      select: {
        id: true,
        name: true,
        path: true,
        isWatched: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            images: true
          }
        }
      }
    })

    console.log('✅ Carpetas encontradas:', folders.length)

    // Transformar los resultados para incluir el conteo de imágenes
    const transformedFolders = folders.map(folder => ({
      ...folder,
      totalFiles: folder._count.images,
      totalSize: 0, // Este valor se calculará cuando sea necesario
    }))

    return NextResponse.json(transformedFolders)
  } catch (error) {
    console.error('❌ Error obteniendo carpetas:', error)
    
    // Verificar si es un error de Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P1001') {
        return NextResponse.json(
          { error: 'Error de conexión a la base de datos', details: error.message },
          { status: 503 }
        )
      }

      // Para otros errores de Prisma
      if (typeof error.code === 'string' && error.code.startsWith('P')) {
        return NextResponse.json(
          { error: 'Error de base de datos', details: error.message },
          { status: 500 }
        )
      }
    }

    // Error genérico
    return NextResponse.json(
      { error: 'Error obteniendo carpetas', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  } finally {
    // Asegurarse de desconectar
    await prisma.$disconnect()
    console.log('✅ Conexión a base de datos cerrada')
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
