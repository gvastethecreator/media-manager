import { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra las carpetas por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedFolders(prisma: PrismaClient): Promise<void> {
  seedLogger.info('📁 Creando carpetas por defecto...');
  
  // Verificar si la tabla Folder existe
  if (await tableExists(prisma, 'Folder')) {
    // Crear carpetas por defecto
    await prisma.folder.createMany({
      data: [
        {
          name: '2025-01-01',
          path: 'G:\\#OUTPUTS\\SDMatrix\\2024-10-04',
          totalFiles: 0,
          totalSize: 0,
        },
        {
          name: 'Upscales',
          path: 'G:\\#OUTPUTS\\Upscales',
          totalFiles: 0,
          totalSize: 0,
        },
        {
          name: 'retro',
          path: 'D:\\Pictures\\retro',
          totalFiles: 0,
          totalSize: 0,
        },
      ],
    });
    
    seedLogger.info('✅ Carpetas por defecto creadas');
  } else {
    seedLogger.warn('⚠️ La tabla Folder no existe, saltando creación de carpetas');
  }
}