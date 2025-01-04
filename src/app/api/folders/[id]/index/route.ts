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
  try {
    // Obtener el ID de manera asíncrona
    const params = await Promise.resolve(context.params);
    const folderId = params.id;
    
    console.log('Iniciando indexación para carpeta:', folderId);

    // Verificar que la carpeta existe
    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    });

    if (!folder) {
      console.error('Carpeta no encontrada:', folderId);
      return NextResponse.json({ error: 'Carpeta no encontrada' }, { status: 404 });
    }

    if (!existsSync(folder.path)) {
      console.error('Carpeta no encontrada en el sistema:', folder.path);
      return NextResponse.json(
        { error: 'Carpeta no encontrada en el sistema' }, 
        { status: 404 }
      );
    }

    // Eliminar imágenes existentes
    await prisma.image.deleteMany({
      where: { folderId }
    });

    // Procesar archivos
    const processDirectory = async (dirPath: string): Promise<{ processed: number; total: number }> => {
      try {
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

            // Asegurarnos de que tenemos las dimensiones
            if (!metadata.dimensions?.width || !metadata.dimensions?.height) {
              console.warn('No se pudieron obtener las dimensiones de la imagen:', {
                file: filePath,
                metadata
              });
              continue;
            }

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
            } catch (thumbnailError) {
              console.error('Error generando thumbnail:', { 
                file: filePath, 
                error: thumbnailError 
              });
            }

            // Crear entrada en la base de datos
            await prisma.image.create({
              data: {
                path: filePath,
                name: file,
                size: metadata.fileSystem?.size || 0,
                hash,
                width: metadata.dimensions.width,
                height: metadata.dimensions.height,
                metadata: JSON.stringify(metadata),
                thumbnail: thumbnailData?.data,
                thumbnailSize: thumbnailData?.size,
                thumbnailWidth: thumbnailData?.width,
                thumbnailHeight: thumbnailData?.height,
                folderId: folder.id,
                createdAt: metadata.fileSystem?.created ? new Date(metadata.fileSystem.created) : new Date(),
                updatedAt: metadata.fileSystem?.modified ? new Date(metadata.fileSystem.modified) : new Date()
              }
            });

            processed++;
          } catch (fileError) {
            console.error('Error procesando archivo:', {
              file,
              path: dirPath,
              error: fileError instanceof Error ? fileError.message : 'Error desconocido'
            });
          }
        }

        return { processed, total };
      } catch (dirError) {
        console.error('Error procesando directorio:', {
          path: dirPath,
          error: dirError instanceof Error ? dirError.message : 'Error desconocido'
        });
        return { processed: 0, total: 0 };
      }
    };

    // Procesar la carpeta
    const stats = await processDirectory(folder.path);

    // Actualizar estadísticas de la carpeta
    const updatedFolder = await prisma.folder.update({
      where: { id: folder.id },
      data: {
        totalFiles: stats.processed,
        lastIndexed: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      folder: updatedFolder,
      stats: {
        processed: stats.processed,
        total: stats.total
      }
    });

  } catch (error) {
    console.error('Error en indexación:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
