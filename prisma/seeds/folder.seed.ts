import { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra las carpetas por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedFolders(prisma: PrismaClient): Promise<void> {
  seedLogger.info('📁 Creando carpetas por defecto...');

  try {
    // Verificar si la tabla Folder existe
    if (await tableExists(prisma, 'Folder')) {
      // Obtener el preset visual por defecto para carpetas
      const folderPreset = await prisma.visualPreset.findFirst({
        where: { name: 'folder-default' }
      });

      // Definir carpetas de ejemplo con sus metadatos
      const sampleFolders = [
        {
          name: 'Imágenes de Paisajes',
          description: 'Colección de fotografías de paisajes naturales',
          path: 'G:\\#OUTPUTS\\SDMatrix\\Landscapes',
          emoji: '🏞️',
          totalFiles: 45,
          totalSize: 230000000, // 230MB en bytes
          lastIndexed: new Date(),
          autoReindex: true,
          color: '#3b82f6',
          isFavorite: true,
          presetId: folderPreset?.id
        },
        {
          name: 'Retratos',
          description: 'Retratos artísticos y fotografías de personas',
          path: 'G:\\#OUTPUTS\\Upscales',
          emoji: '👤',
          totalFiles: 78,
          totalSize: 450000000, // 450MB
          lastIndexed: new Date(),
          autoReindex: true,
          color: '#60a5fa',
          presetId: folderPreset?.id
        },
        {
          name: 'Estilo Retro',
          description: 'Imágenes con estilo retro y vintage',
          path: 'D:\\Pictures\\retro',
          emoji: '📷',
          totalFiles: 32,
          totalSize: 180000000, // 180MB
          lastIndexed: new Date(),
          autoReindex: false,
          color: '#93c5fd',
          presetId: folderPreset?.id
        },
        {
          name: 'AI Generada',
          description: 'Imágenes generadas con inteligencia artificial',
          path: 'D:\\AI\\generated',
          emoji: '🤖',
          totalFiles: 120,
          totalSize: 600000000, // 600MB
          lastIndexed: new Date(),
          autoReindex: true,
          color: '#2563eb',
          isFavorite: true,
          presetId: folderPreset?.id
        },
        {
          name: 'Fondos de Pantalla',
          description: 'Colección de fondos de pantalla en alta resolución',
          path: 'D:\\Wallpapers',
          emoji: '🖼️',
          totalFiles: 56,
          totalSize: 350000000, // 350MB
          lastIndexed: new Date(),
          autoReindex: false,
          color: '#1d4ed8',
          presetId: folderPreset?.id
        }
      ];

      // Crear carpetas con sus configuraciones visuales
      for (const folderData of sampleFolders) {
        await prisma.folder.create({
          data: {
            ...folderData,
            // Crear configuración visual para la carpeta
            visualConfig: {
              create: {
                enable3DEffect: true,
                enableHolographicEffect: true,
                enableGlowEffect: true,
                enableAnimatedBorder: true,
                enableLightHalo: true,
                // También conectar el preset a la configuración visual
                presetId: folderPreset?.id,
                // Configuración JSON personalizada para diseño
                designSystem: JSON.stringify({
                  preset: "folder",
                  cornerStyle: "rounded",
                  aspectRatio: "7/10",
                  elevation: 2,
                  shadowStyle: "soft"
                }),
                // Configuración de efectos
                effects: JSON.stringify({
                  shadow: {
                    enabled: true,
                    color: "rgba(0,0,0,0.2)",
                    blur: 10,
                    spread: 5
                  },
                  reflection: {
                    enabled: true,
                    opacity: 0.1,
                    blur: 2
                  },
                  parallax: {
                    enabled: true,
                    intensity: 0.1,
                    perspective: 1000
                  }
                })
              }
            }
          }
        });
      }

      seedLogger.info(`✅ ${sampleFolders.length} carpetas creadas con presets visuales`);
    } else {
      seedLogger.warn('⚠️ La tabla Folder no existe, saltando creación de carpetas');
    }
  } catch (error) {
    seedLogger.error('❌ Error creando carpetas:', error);
    throw error;
  }
}