import { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra los álbumes por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedAlbums(prisma: PrismaClient): Promise<void> {
  seedLogger.info('📔 Creando álbumes por defecto...');
  
  // Verificar si la tabla Album existe
  if (await tableExists(prisma, 'Album')) {
    // Crear álbumes por defecto
    await prisma.album.createMany({
      data: [
        {
          name: 'Favoritos 2024',
          emoji: '⭐',
          color: '#eab308',
          description: 'Imágenes favoritas del 2024',
          shortcut: 'f24',
        },
        {
          name: 'Referencias',
          emoji: '📚',
          color: '#8b5cf6',
          description: 'Referencias e inspiración',
          shortcut: 'ref',
        },
        {
          name: 'Inspiración',
          emoji: '💡',
          color: '#10b981',
          description: 'Ideas y conceptos',
          shortcut: 'ins',
        },
        {
          name: 'Pruebas',
          emoji: '🧪',
          color: '#eab308',
          description: 'Pruebas y experimentos',
          shortcut: 'pr',
        },
        {
          name: 'Pixel Art',
          emoji: '🎨',
          color: '#8b5cf6',
          description: 'Pixel Art',
          shortcut: 'pa',
        },
        {
          name: 'Upscales',
          emoji: '✨',
          color: '#10b981',
          description: 'Upscales',
          shortcut: 'up',
        },
        {
          name: 'Diseños',
          emoji: '🖌️',
          color: '#3498db',
          description: 'Diseños y prototipos',
          shortcut: 'dis',
        },
        {
          name: 'Ilustraciones',
          emoji: '🎭',
          color: '#f1c40f',
          description: 'Ilustraciones y dibujos',
          shortcut: 'ilu',
        },
        {
          name: 'Fotografía',
          emoji: '📸',
          color: '#2ecc71',
          description: 'Fotografías y capturas',
          shortcut: 'fot',
        },
      ],
    });
    
    seedLogger.info('✅ Álbumes por defecto creados');
  } else {
    seedLogger.warn('⚠️ La tabla Album no existe, saltando creación de álbumes');
  }
}