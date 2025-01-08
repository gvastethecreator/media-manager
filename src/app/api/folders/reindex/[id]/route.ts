import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { existsSync } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import { generateThumbnail } from '@/lib/thumbnail'
import { getImageMetadata } from '@/lib/metadata'
import { computeHash } from '@/lib/hash'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const folderId = context.params.id;
  console.log('Iniciando reindexación para carpeta:', folderId);

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

    // Iniciar proceso de reindexación
    console.log('Iniciando proceso para carpeta:', folder.path);

    // Eliminar imágenes existentes
    await prisma.image.deleteMany({
      where: { folderId }
    });

    // Procesar archivos
    const processDirectory = async (dirPath: string) => {
      console.log('Procesando directorio:', dirPath);
      const files = await readdir(dirPath);
      let processed = 0;
      let total = 0;

      // Contar archivos válidos
      for (const file of files) {
        const filePath = join(dirPath, file);
        const stats = await stat(filePath);

        if (stats.isDirectory()) {
          const subDirStats = await processDirectory(filePath);
          total += subDirStats.total;
        } else {
          const ext = extname(file).toLowerCase();
          if (SUPPORTED_FORMATS.includes(ext)) {
            total++;
          }
        }
      }

      // Procesar archivos
      for (const file of files) {
        try {
          const filePath = join(dirPath, file);
          const stats = await stat(filePath);

          if (stats.isDirectory()) {
            const subDirStats = await processDirectory(filePath);
            processed += subDirStats.processed;
            continue;
          }

          const ext = extname(file).toLowerCase();
          if (!SUPPORTED_FORMATS.includes(ext)) {
            continue;
          }

          console.log('Procesando archivo:', filePath);

          // Obtener metadata y hash
          const [metadata, hash] = await Promise.all([
            getImageMetadata(filePath),
            computeHash(filePath)
          ]);

          // Generar thumbnail
          let thumbnailData = null;
          try {
            const result = await generateThumbnail(filePath);
            if (result?.buffer) {
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
              width: metadata.dimensions?.width || 0,
              height: metadata.dimensions?.height || 0,
              metadata: JSON.stringify(metadata),
              thumbnail: thumbnailData?.data || null,
              thumbnailSize: thumbnailData?.size || null,
              thumbnailWidth: thumbnailData?.width || null,
              thumbnailHeight: thumbnailData?.height || null,
              folderId,
              createdAt: stats.birthtime,
              updatedAt: stats.mtime
            }
          });

          processed++;

        } catch (error) {
          console.error('Error procesando archivo:', error);
        }
      }

      return { processed, total };
    };

    // Iniciar procesamiento
    const { processed, total } = await processDirectory(folder.path);

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

    return new NextResponse(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en reindexación:', error);

    return new NextResponse(JSON.stringify({
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
