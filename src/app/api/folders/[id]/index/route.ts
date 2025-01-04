import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { existsSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import { generateThumbnail } from '@/lib/thumbnail'
import { getImageMetadata } from '@/lib/metadata'
import { computeHash } from '@/lib/hash'

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const folderId = context.params.id;
  console.log('Iniciando indexación para carpeta:', folderId);

  try {
    // Verificar que la carpeta existe
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder) {
      console.error('Carpeta no encontrada:', folderId);
      return new NextResponse(JSON.stringify({ error: 'Carpeta no encontrada' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!existsSync(folder.path)) {
      console.error('Carpeta no encontrada en el sistema:', folder.path);
      return new NextResponse(JSON.stringify({ error: 'Carpeta no encontrada en el sistema' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Eliminar imágenes existentes
    await prisma.image.deleteMany({
      where: { folderId }
    });

    // Procesar archivos
    const processDirectory = async (dirPath: string): Promise<{ processed: number; total: number }> => {
      const files = await readdir(dirPath);
      let processed = 0;
      let total = 0;

      for (const file of files) {
        try {
          const filePath = join(dirPath, file);
          const stats = await stat(filePath);

          if (stats.isDirectory()) {
            const subDirStats = await processDirectory(filePath);
            processed += subDirStats.processed;
            total += subDirStats.total;
            continue;
          }

          const ext = extname(file).toLowerCase();
          if (!SUPPORTED_FORMATS.includes(ext)) {
            continue;
          }

          total++;

          // Obtener metadata y hash
          const metadata = await getImageMetadata(filePath);
          const hash = await computeHash(filePath);

          // Generar thumbnail
          let thumbnailData = null;
          try {
            const result = await generateThumbnail(filePath);
            if (result && result.buffer) {
              thumbnailData = {
                data: result.buffer,
                size: result.buffer.length,
                width: result.width,
                height: result.height
              };
            }
          } catch (error) {
            console.error('Error generando thumbnail:', error);
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
              thumbnail: thumbnailData?.data,
              thumbnailSize: thumbnailData?.size,
              thumbnailWidth: thumbnailData?.width,
              thumbnailHeight: thumbnailData?.height,
              folderId: folder.id,
              createdAt: stats.birthtime,
              updatedAt: stats.mtime
            }
          });

          processed++;
        } catch (error) {
          console.error('Error procesando archivo:', file, error);
        }
      }

      return { processed, total };
    };

    // Procesar la carpeta
    const stats = await processDirectory(folder.path);

    // Actualizar estadísticas de la carpeta
    await prisma.folder.update({
      where: { id: folder.id },
      data: {
        totalFiles: stats.processed,
        lastIndexed: new Date()
      }
    });

    return new NextResponse(JSON.stringify({
      success: true,
      stats: {
        processed: stats.processed,
        total: stats.total
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en indexación:', error);
    return new NextResponse(JSON.stringify({
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
