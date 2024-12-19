import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { computeHash } from '@/lib/server-utils'
import { getImageMetadata } from '@/lib/image.server'
import { THUMBNAIL_QUALITY_CONFIG, type ThumbnailQuality } from '@/services/thumbnail.service'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verificar la conexión a la base de datos
    await prisma.$connect()

    const { path: folderPath, thumbnailQuality = 'mid' } = await request.json() as { path: string, thumbnailQuality?: ThumbnailQuality }
    console.log('📥 Adding folder:', { folderPath, thumbnailQuality })

    // Verificar si la carpeta ya existe
    const existingFolder = await prisma.folder.findUnique({
      where: { path: folderPath }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Folder already exists' },
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

        // Procesar cada archivo
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          try {
            // Enviar actualización de progreso
            const progress = Math.round(((i + 1) / files.length) * 100)
            await writer.write(encoder.encode(JSON.stringify({
              type: 'progress',
              data: {
                current: i + 1,
                total: files.length,
                progress,
                currentFile: file.name
              }
            }) + '\n'))

            // Obtener metadata y generar hash
            const metadata = await getImageMetadata(file.path)
            const hash = await computeHash(file.path)

            // Crear entrada en la base de datos
            const image = await prisma.image.create({
              data: {
                path: file.path,
                name: file.name,
                size: file.size,
                hash,
                metadata: metadata as any,
                folderId: folder.id
              }
            })

            // Generar thumbnail con la calidad configurada
            const qualityConfig = THUMBNAIL_QUALITY_CONFIG[thumbnailQuality]
            const imageBuffer = await sharp(file.path)
              .resize(qualityConfig.width, qualityConfig.height, {
                fit: 'inside',
                withoutEnlargement: true
              })
              .webp({ quality: qualityConfig.quality })
              .toBuffer()

            // Actualizar imagen con thumbnail
            await prisma.image.update({
              where: { id: image.id },
              data: {
                thumbnail: imageBuffer.toString('base64'),
                thumbnailSize: imageBuffer.length
              }
            })

            console.log('✅ Processed:', file.name)
          } catch (error) {
            console.error('❌ Error processing file:', file.name, error)
            // Enviar error pero continuar con el siguiente archivo
            await writer.write(encoder.encode(JSON.stringify({
              type: 'error',
              data: {
                file: file.name,
                error: error instanceof Error ? error.message : String(error)
              }
            }) + '\n'))
          }
        }

        // Actualizar estadísticas de la carpeta
        const totalSize = files.reduce((acc, file) => acc + file.size, 0)
        await prisma.folder.update({
          where: { id: folder.id },
          data: {
            totalFiles: files.length,
            totalSize,
            lastIndexed: new Date()
          }
        })

        // Enviar mensaje de finalización
        await writer.write(encoder.encode(JSON.stringify({
          type: 'complete',
          data: { folder }
        }) + '\n'))
      } catch (error) {
        console.error('Error processing folder:', error)
        await writer.write(encoder.encode(JSON.stringify({
          type: 'error',
          data: { error: error instanceof Error ? error.message : String(error) }
        }) + '\n'))
      } finally {
        await writer.close()
      }
    })()

    // Devolver el stream como respuesta
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Error initiating folder processing:', error)
    return NextResponse.json(
      { error: 'Error adding folder', details: error instanceof Error ? error.message : String(error) },
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

    // Verificamos que la tabla Folder existe
    try {
      const tableExists = await prisma.$queryRaw`
        SELECT name
        FROM sqlite_master
        WHERE type='table'
        AND name='Folder'
      `
      if (!Array.isArray(tableExists) || tableExists.length === 0) {
        console.log('⚠️ Tabla Folder no encontrada, creando...')
        try {
          await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS Folder (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT NOT NULL UNIQUE,
            isWatched BOOLEAN NOT NULL DEFAULT false,
            totalFiles INTEGER NOT NULL DEFAULT 0,
            totalSize INTEGER NOT NULL DEFAULT 0,
            lastIndexed DATETIME,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL
          )`
          console.log('✅ Tabla Folder creada')
        } catch (migrationError) {
          console.error('❌ Error creando tabla:', migrationError)
          return NextResponse.json(
            { error: 'Error creando tabla Folder', details: migrationError instanceof Error ? migrationError.message : String(migrationError) },
            { status: 500 }
          )
        }
      } else {
        console.log('✅ Tabla Folder verificada')
      }
    } catch (tableCheckError) {
      console.error('❌ Error verificando tabla:', tableCheckError)
      return NextResponse.json(
        { error: 'Error verificando tabla Folder', details: tableCheckError instanceof Error ? tableCheckError.message : String(tableCheckError) },
        { status: 500 }
      )
    }

    console.log('🔄 Consultando carpetas...')
    const folders = await prisma.folder.findMany({
      select: {
        id: true,
        name: true,
        path: true,
        isWatched: true,
        totalFiles: true,
        totalSize: true,
        _count: {
          select: {
            images: true
          }
        }
      }
    })
    console.log('✅ Carpetas encontradas:', folders.length)

    return NextResponse.json(folders)
  } catch (error) {
    console.error('❌ Error obteniendo carpetas:', error)
    
    // Verificar si es un error de Prisma
    if (error.code === 'P1001') {
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos', details: error.message },
        { status: 503 }
      )
    }

    // Para otros errores de Prisma
    if (error.code?.startsWith('P')) {
      return NextResponse.json(
        { error: 'Error de base de datos', details: error.message },
        { status: 500 }
      )
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
