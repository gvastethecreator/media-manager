import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra los álbumes por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedAlbums(prisma: PrismaClient): Promise<void> {
  seedLogger.info('📔 Creando álbumes por defecto...');

  try {
    // Verificar si la tabla Album existe
    if (await tableExists(prisma, 'Album')) {
      // Obtener el preset visual por defecto para álbumes
      const albumPreset = await prisma.visualPreset.findFirst({
        where: { name: 'album-default' }
      });

      // Definir álbumes de ejemplo con sus metadatos
      const sampleAlbums = [
        {
          name: 'Favoritos 2024',
          emoji: '⭐',
          color: '#eab308',
          description: 'Imágenes favoritas del 2024',
          shortcut: 'f24',
          sortBy: 'createdAt',
          filters: JSON.stringify(['isFavorite']),
          category: 'Favoritos',
          rarity: 'legendary',
        },
        {
          name: 'Referencias',
          emoji: '📚',
          color: '#8b5cf6',
          description: 'Referencias e inspiración',
          shortcut: 'ref',
          sortBy: 'name',
          filters: JSON.stringify(['type:reference']),
          category: 'Inspiración',
          rarity: 'uncommon',
        },
        {
          name: 'Inspiración',
          emoji: '💡',
          color: '#10b981',
          description: 'Ideas y conceptos',
          shortcut: 'ins',
          sortBy: 'updatedAt',
          filters: JSON.stringify(['tag:ideas']),
          category: 'Inspiración',
          rarity: 'uncommon',
        },
        {
          name: 'Pruebas',
          emoji: '🧪',
          color: '#eab308',
          description: 'Pruebas y experimentos',
          shortcut: 'pr',
          sortBy: 'createdAt',
          filters: JSON.stringify(['tag:experimental']),
          category: 'Técnico',
          rarity: 'common',
        },
        {
          name: 'Pixel Art',
          emoji: '🎨',
          color: '#8b5cf6',
          description: 'Pixel Art',
          shortcut: 'pa',
          sortBy: 'name',
          filters: JSON.stringify(['type:pixelart']),
          category: 'Artístico',
          rarity: 'rare',
        },
        {
          name: 'Upscales',
          emoji: '✨',
          color: '#10b981',
          description: 'Upscales',
          shortcut: 'up',
          sortBy: 'createdAt',
          filters: JSON.stringify(['tag:upscale']),
          category: 'Técnico',
          rarity: 'common',
        },
        {
          name: 'Diseños',
          emoji: '🖌️',
          color: '#3498db',
          description: 'Diseños y prototipos',
          shortcut: 'dis',
          sortBy: 'updatedAt',
          filters: JSON.stringify(['type:design']),
          category: 'Profesional',
          rarity: 'rare',
        },
        {
          name: 'Ilustraciones',
          emoji: '🎭',
          color: '#f1c40f',
          description: 'Ilustraciones y dibujos',
          shortcut: 'ilu',
          sortBy: 'name',
          filters: JSON.stringify(['type:illustration']),
          category: 'Artístico',
          rarity: 'rare',
        },
        {
          name: 'Fotografía',
          emoji: '📸',
          color: '#2ecc71',
          description: 'Fotografías y capturas',
          shortcut: 'fot',
          sortBy: 'createdAt',
          filters: JSON.stringify(['type:photo']),
          category: 'Profesional',
          rarity: 'uncommon',
        },
        {
          name: 'Conceptos',
          emoji: '🧠',
          color: '#9b59b6',
          description: 'Arte conceptual',
          shortcut: 'con',
          sortBy: 'name',
          filters: JSON.stringify(['type:concept']),
          category: 'Artístico',
          rarity: 'epic',
        }
      ];

      // Crear álbumes
      for (const albumData of sampleAlbums) {
        if (albumPreset) {
          await prisma.album.create({
            data: {
              ...albumData,
              // Usar connect en lugar de presetId directo
              preset: {
                connect: { id: albumPreset.id }
              }
            }
          });
        } else {
          // Si no hay preset, crear el álbum sin referencia al preset
          await prisma.album.create({
            data: albumData
          });
        }
      }

      seedLogger.info(`✅ ${sampleAlbums.length} álbumes creados con éxito`);
    } else {
      seedLogger.warn('⚠️ La tabla Album no existe, saltando creación de álbumes');
    }
  } catch (error) {
    seedLogger.error('❌ Error creando álbumes:', error);
    throw error;
  }
}