import { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra las colecciones por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedCollections(prisma: PrismaClient): Promise<void> {
  seedLogger.info('📚 Creando colecciones por defecto...');
  
  // Verificar si la tabla Collection existe
  if (await tableExists(prisma, 'Collection')) {
    // Crear colecciones por defecto
    await prisma.collection.createMany({
      data: [
        {
          name: 'Pepe Archives',
          emoji: '🐸',
          color: '#8b5cf6',
          description: 'Archivos de Pepe',
          shortcut: 'pepe',
        },
        {
          name: 'Life after Moklos',
          emoji: '🏠',
          color: '#10b981',
          description: 'Vida después de Moklos',
          shortcut: 'lalm',
        },
        {
          name: 'Moklos',
          emoji: '🏠',
          color: '#C63AC4FF',
          description: 'Vida antes de Moklos',
          shortcut: 'mok',
        },
        {
          name: 'Retro',
          emoji: '🎥',
          color: '#B9A847FF',
          description: 'Retro',
          shortcut: 'ret',
        },
        {
          name: 'Bootlegs',
          emoji: '🎥',
          color: '#3AC651FF',
          description: 'Bootlegs',
          shortcut: 'bl',
        },
        {
          name: '3D',
          emoji: '🎥',
          color: '#35556EFF',
          description: '3D',
          shortcut: '3d',
        },
        {
          name: 'Anime',
          emoji: '🎬',
          color: '#8b5cf6',
          description: 'Anime',
          shortcut: 'ani',
        },
        {
          name: 'Manga',
          emoji: '📚',
          color: '#f1c40f',
          description: 'Manga',
          shortcut: 'manga',
        },
      ],
    });
    
    seedLogger.info('✅ Colecciones por defecto creadas');
  } else {
    seedLogger.warn('⚠️ La tabla Collection no existe, saltando creación de colecciones');
  }
}