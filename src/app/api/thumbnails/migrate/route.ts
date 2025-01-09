import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { existsSync } from 'fs'
import { ThumbnailQuality } from '@/services/thumbnail.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const writeEvent = async (event: string, data: any) => {
    await writer.write(encoder.encode(JSON.stringify({ type: event, data }) + '\n'))
  }

  try {
    // Obtener imágenes sin thumbnail
    const images = await prisma.image.findMany({
      where: {
        thumbnail: null,
        thumbnailError: null
      },
      select: {
        id: true,
        path: true
      }
    })

    const total = images.length
    let current = 0
    let migrated = 0

    // Procesar cada imagen
    for (const image of images) {
      current++
      const progress = Math.round((current / total) * 100)

      try {
        // Verificar que el archivo original existe
        if (!existsSync(image.path)) {
          await writeEvent('error', {
            file: image.path,
            error: 'Original file not found'
          })
          continue
        }

        // Generar thumbnail
        const result = await generateThumbnail(image.path, { quality: 'medium' })

        if (!result) {
          throw new Error('Error generando miniatura')
        }

        // Actualizar en base de datos
        await prisma.image.update({
          where: { id: image.id },
          data: {
            thumbnail: result.buffer,
            thumbnailWidth: result.width,
            thumbnailHeight: result.height,
            thumbnailError: null,
            thumbnailErrorAt: null
          }
        })

        migrated++
        await writeEvent('progress', {
          current,
          total,
          progress,
          currentFile: image.path,
          status: `Migrando imagen ${current} de ${total}`
        })
      } catch (error) {
        console.error('Error migrando imagen:', error)
        await writeEvent('error', {
          file: image.path,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })

        // Actualizar error en base de datos
        await prisma.image.update({
          where: { id: image.id },
          data: {
            thumbnailError: error instanceof Error ? error.message : 'Error desconocido',
            thumbnailErrorAt: new Date()
          }
        })
      }
    }

    // Enviar evento de completado
    await writeEvent('complete', {
      processed: current,
      migrated,
      total
    })

    await writer.close()
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Error en migración:', error)
    await writer.close()
    return NextResponse.json(
      { error: 'Error al migrar las miniaturas' },
      { status: 500 }
    )
  }
}