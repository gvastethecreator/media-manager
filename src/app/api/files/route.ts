import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(request: NextRequest) {
  console.log('📥 GET /api/files - Iniciando solicitud')
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    console.log('🔍 Parámetros:', { path, url: request.url })

    // Verificamos que la tabla image existe
    try {
      const tableExists = await prisma.$queryRaw`
        SELECT name
        FROM sqlite_master
        WHERE type='table'
        AND name='Image'
      `
      if (!Array.isArray(tableExists) || tableExists.length === 0) {
        console.log('⚠️ Tabla no encontrada, ejecutando migraciones...')
        try {
          await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS Image (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            size INTEGER NOT NULL,
            mimeType TEXT,
            metadata TEXT,
            thumbnail TEXT,
            thumbnailSize INTEGER,
            thumbnailError TEXT,
            thumbnailErrorAt DATETIME,
            createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME NOT NULL
          )`
          console.log('✅ Tabla Image creada')
        } catch (migrationError) {
          console.error('❌ Error creando tabla:', migrationError)
          return NextResponse.json(
            { error: 'Error creando tabla Image', details: migrationError instanceof Error ? migrationError.message : String(migrationError) },
            { status: 500 }
          )
        }
      } else {
        console.log('✅ Tabla Image verificada')
      }
    } catch (tableError) {
      console.error('❌ Error verificando tabla Image:', {
        error: tableError instanceof Error ? tableError.message : tableError,
        stack: tableError instanceof Error ? tableError.stack : undefined
      })
      return NextResponse.json(
        { error: 'Error verificando tabla Image', details: tableError instanceof Error ? tableError.message : String(tableError) },
        { status: 500 }
      )
    }

    console.log('🔄 Consultando base de datos...')
    const whereClause = path
      ? { path: { startsWith: path } }
      : { path: 'Home' };

    console.log('🔍 Consulta con:', { whereClause })

    // Intentamos obtener las imágenes
    let images
    try {
      images = await prisma.image.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        include: {
          folder: true,
          tags: true,
          collections: true
        }
      })
      console.log('✅ Consulta exitosa')
    } catch (queryError) {
      console.error('❌ Error en consulta:', {
        error: queryError instanceof Error ? queryError.message : queryError,
        stack: queryError instanceof Error ? queryError.stack : undefined
      })
      return NextResponse.json(
        { error: 'Error consultando imágenes', details: queryError instanceof Error ? queryError.message : String(queryError) },
        { status: 500 }
      )
    }

    console.log('📚 Imágenes encontradas:', {
      count: images.length,
      sample: images.slice(0, 2).map(img => ({
        id: img.id,
        name: img.name,
        path: img.path,
        hasThumbnail: !!img.thumbnail
      }))
    })

    // Convertir las imágenes al formato esperado por el cliente
    const files = images.map(image => {
      try {
        const file = {
          id: image.id,
          name: image.name,
          path: image.path,
          size: image.size,
          type: image.mimeType,
          lastModified: image.updatedAt,
          isDirectory: false,
          metadata: image.metadata ? JSON.parse(image.metadata) : null,
          thumbnailUrl: `/api/images/${image.id}/thumbnail`,
          previewUrl: `/api/images/${image.id}/preview`,
          downloadUrl: `/api/images/${image.id}/download`,
          folder: image.folder ? {
            id: image.folder.id,
            name: image.folder.name,
            path: image.folder.path
          } : null,
          tags: image.tags.map(tag => ({
            id: tag.id,
            name: tag.name,
            color: tag.color
          })),
          collections: image.collections.map(collection => ({
            id: collection.id,
            name: collection.name,
            emoji: collection.emoji
          }))
        }

        console.log('🖼️ Imagen procesada:', {
          id: file.id,
          name: file.name,
          thumbnailUrl: file.thumbnailUrl
        })

        return file
      } catch (parseError) {
        console.error('❌ Error procesando imagen:', {
          imageId: image.id,
          error: parseError instanceof Error ? parseError.message : parseError
        })
        return null
      }
    }).filter(Boolean)

    console.log('✅ Respuesta preparada:', {
      count: files.length,
      sample: files.slice(0, 2).map(f => ({
        id: f.id,
        name: f.name,
        thumbnailUrl: f.thumbnailUrl
      }))
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error('❌ Error en GET /api/files:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
