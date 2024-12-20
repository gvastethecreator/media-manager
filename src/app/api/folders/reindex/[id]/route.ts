import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { computeHash } from '@/lib/server-utils'
import { getImageMetadata } from '@/lib/image.server'

export const dynamic = 'force-dynamic'

type RouteParams = { params: { id: string } }

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    // Verificar la conexión a la base de datos
    await prisma.$connect()

    // Obtener la carpeta
    const folder = await prisma.folder.findUnique({
      where: { id: context.params.id }
    })

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      )
    }

    // Verificar si la carpeta existe en el sistema de archivos
    try {
      const stats = statSync(folder.path)
      if (!stats.isDirectory()) {
        return NextResponse.json(
          { error: 'Path is not a directory' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Directory not found' },
        { status: 404 }
      )
    }

    // Crear un TransformStream para enviar actualizaciones de progreso
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()
    const encoder = new TextEncoder()

    // Iniciar el procesamiento en segundo plano
    const processPromise = (async () => {
      try {
        // Leer los archivos de la carpeta
        const files = readdirSync(folder.path)
          .map(file => {
            const filePath = join(folder.path, file)
            const stats = statSync(filePath)
            return {
              path: filePath,
              name: file,
              size: stats.size,
              isDirectory: stats.isDirectory()
            }
          })
          .filter(file => !file.isDirectory && /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))

        console.log(' Reindexing images:', files.length)

        let totalSize = 0
        let processedFiles = 0

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

            // Verificar si la imagen ya existe
            const existingImage = await prisma.image.findFirst({
              where: {
                OR: [
                  { path: file.path },
                  { name: file.name, folderId: folder.id }
                ]
              }
            })

            // Obtener metadata y generar hash
            const metadata = await getImageMetadata(file.path)
            const hash = await computeHash(file.path)

            if (existingImage) {
              // Actualizar imagen existente
              await prisma.image.update({
                where: { id: existingImage.id },
                data: {
                  size: file.size,
                  hash,
                  metadata: JSON.stringify(metadata),
                  path: file.path,
                  name: file.name
                }
              })
            } else {
              // Crear nueva imagen
              await prisma.image.create({
                data: {
                  path: file.path,
                  name: file.name,
                  size: file.size,
                  hash,
                  metadata: JSON.stringify(metadata),
                  folderId: folder.id,
                  isPublic: false
                }
              })
            }

            totalSize += file.size
            processedFiles++

            console.log(' Processed:', file.name)
          } catch (error) {
            console.error(' Error processing file:', file.name, error)
            // Enviar error pero continuar con el siguiente archivo
            await writer.write(encoder.encode(JSON.stringify({
              type: 'error',
              data: {
                file: file.name,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }) + '\n'))
          }
        }

        // Actualizar estadísticas de la carpeta
        await prisma.folder.update({
          where: { id: folder.id },
          data: {
            totalFiles: processedFiles,
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
        console.error('Error reindexing folder:', error)
        await writer.write(encoder.encode(JSON.stringify({
          type: 'error',
          data: {
            file: 'folder',
            error: error instanceof Error ? error.message : 'Unknown error'
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
    console.error('Error in POST /api/folders/reindex:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
