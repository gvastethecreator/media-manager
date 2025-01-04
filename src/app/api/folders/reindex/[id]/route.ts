import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateThumbnail } from '@/lib/thumbnail'
import { getImageMetadata } from '@/lib/metadata'
import { computeHash } from '@/lib/hash'
import { existsSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import { sendEvent, hasActiveStream, cleanupStream } from '@/lib/stream'

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Ruta principal para iniciar el proceso
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const folderId = params.id;

  try {
    if (!folderId) {
      return new NextResponse(JSON.stringify({ error: 'ID de carpeta requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Iniciando reindexación para carpeta:', folderId);

    // Verificar que la carpeta existe
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder) {
      return new NextResponse(JSON.stringify({
        error: 'Carpeta no encontrada',
        code: 'FOLDER_NOT_FOUND'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Esperar a que el stream esté activo
    let retries = 0;
    const MAX_RETRIES = 50; // Aumentamos significativamente los reintentos
    const RETRY_DELAY = 100; // 100ms entre intentos

    while (!hasActiveStream(folderId) && retries < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      retries++;
      console.log(`Esperando stream activo (${retries}/${MAX_RETRIES})...`);
    }

    if (!hasActiveStream(folderId)) {
      console.error('No se pudo establecer stream para:', folderId);
      return new NextResponse(JSON.stringify({
        error: 'No se pudo establecer la conexión de eventos',
        code: 'STREAM_NOT_READY'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Iniciar el proceso en background
    processFolder(folderId).catch(error => {
      console.error('Error fatal en processFolder:', error);
      cleanupStream(folderId);
    });

    return new NextResponse(JSON.stringify({
      status: 'started',
      folder,
      message: 'Reindexación iniciada correctamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error iniciando reindexación:', error);
    if (folderId) cleanupStream(folderId);
    return new NextResponse(JSON.stringify({
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Función principal de procesamiento
async function processFolder(folderId: string) {
  try {
    console.log('Iniciando procesamiento para carpeta:', folderId);

    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder) {
      throw new Error('Carpeta no encontrada');
    }

    if (!existsSync(folder.path)) {
      throw new Error('Carpeta no encontrada en el sistema');
    }

    await sendEvent(folderId, 'progress', {
      status: 'Iniciando reindexación...',
      current: 0,
      total: 0,
      progress: 0
    });

    // Eliminar imágenes existentes
    await prisma.image.deleteMany({
      where: { folderId }
    });

    // Procesar la carpeta
    const { processed, total, pendingMetadata } = await processDirectory(folder.path, folderId);

    // Esperar a que termine el procesamiento de metadata en segundo plano
    await Promise.allSettled(pendingMetadata);

    // Actualizar estadísticas de la carpeta
    const stats = await prisma.image.aggregate({
      where: { folderId },
      _sum: { size: true },
      _count: true
    });

    await prisma.folder.update({
      where: { id: folderId },
      data: {
        totalFiles: stats._count,
        totalSize: stats._sum.size || 0,
        lastIndexed: new Date()
      }
    });

    // Enviar evento de completado
    await sendEvent(folderId, 'complete', {
      processed,
      total,
      errors: total - processed,
      folder: {
        id: folder.id,
        name: folder.name,
        path: folder.path,
        totalFiles: stats._count,
        totalSize: stats._sum.size || 0
      }
    });

  } catch (error) {
    console.error('Error en reindexación:', error);
    await sendEvent(folderId, 'error', {
      type: 'PROCESS_ERROR',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  } finally {
    // No cerramos el stream aquí, lo dejamos para que el cliente lo cierre
    console.log('Proceso de reindexación finalizado para:', folderId);
  }
}

// Ruta para eventos SSE
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
  if (!id) {
    return new NextResponse(JSON.stringify({ error: 'ID de carpeta requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { stream } = await createStream(id, request)

    // Enviar evento inicial
    const initialEvent = JSON.stringify({ type: 'connected', data: { id } })
    const writer = stream.writable.getWriter()
    await writer.write(new TextEncoder().encode(`data: ${initialEvent}\n\n`))
    writer.releaseLock()

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('Error configurando SSE:', error)
    return new NextResponse(JSON.stringify({
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Modificar la función processDirectory para recibir folderId
async function processDirectory(dirPath: string, folderId: string): Promise<{ processed: number; total: number; pendingMetadata: Promise<void>[] }> {
  const files = await readdir(dirPath)
  let processed = 0
  let total = 0
  let pendingMetadata: Promise<void>[] = []

  // Primero contar archivos válidos
  for (const file of files) {
    const filePath = join(dirPath, file)
    const stats = await stat(filePath)

    if (stats.isDirectory()) {
      const subDirStats = await processDirectory(filePath, folderId)
      total += subDirStats.total
      pendingMetadata = [...pendingMetadata, ...subDirStats.pendingMetadata]
    } else {
      const ext = extname(file).toLowerCase()
      if (SUPPORTED_FORMATS.includes(ext)) {
        total++
      }
    }
  }

  // Enviar evento con el total inicial
  if (total > 0) {
    await sendEvent(folderId, 'progress', {
      current: processed,
      total,
      progress: 0,
      status: `Encontrados ${total} archivos para procesar...`
    })
  }

  // Procesar archivos
  for (const file of files) {
    try {
      const filePath = join(dirPath, file)
      const stats = await stat(filePath)

      if (stats.isDirectory()) {
        const subDirStats = await processDirectory(filePath, folderId)
        processed += subDirStats.processed
        continue
      }

      const ext = extname(file).toLowerCase()
      if (!SUPPORTED_FORMATS.includes(ext)) {
        continue
      }

      // Obtener información básica del archivo
      const fileSize = stats.size
      const hash = await computeHash(filePath)

      // Generar thumbnail
      let thumbnailData = null
      try {
        const result = await generateThumbnail(filePath, 'mid')
        if (result && result.buffer) {
          thumbnailData = {
            data: result.buffer,
            size: result.buffer.length,
            width: result.width,
            height: result.height
          }
        }
      } catch (thumbnailError) {
        console.error('Error generando thumbnail:', thumbnailError)
      }

      // Crear entrada inicial en la base de datos
      const image = await prisma.image.create({
        data: {
          path: filePath,
          name: file,
          size: fileSize,
          hash,
          width: 0,
          height: 0,
          metadata: JSON.stringify({
            fileSystem: {
              size: fileSize,
              created: stats.birthtime.toISOString(),
              modified: stats.mtime.toISOString()
            }
          }),
          thumbnail: thumbnailData?.data || null,
          thumbnailSize: thumbnailData?.size || null,
          thumbnailWidth: thumbnailData?.width || null,
          thumbnailHeight: thumbnailData?.height || null,
          folderId,
          createdAt: stats.birthtime,
          updatedAt: stats.mtime
        }
      })

      // Iniciar procesamiento de metadata en segundo plano
      pendingMetadata.push(processMetadataInBackground(image, folderId))

      processed++
      const progress = Math.round((processed / total) * 100)

      await sendEvent(folderId, 'progress', {
        file: filePath,
        current: processed,
        total,
        progress,
        status: `Procesando archivo ${processed} de ${total}...`,
        pendingMetadata: pendingMetadata.length
      })

    } catch (error) {
      console.error('Error procesando archivo:', error)
      await sendEvent(folderId, 'error', {
        type: 'PROCESS_ERROR',
        message: error instanceof Error ? error.message : 'Error desconocido',
        file
      })
    }
  }

  return { processed, total, pendingMetadata }
}

