import { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra los elementos del mundo (worldItem, place, character) por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedWorldEntities(prisma: PrismaClient): Promise<void> {
  // World Items
  await seedWorldItems(prisma);
  
  // Places
  await seedPlaces(prisma);
  
  // Characters
  await seedCharacters(prisma);
}

/**
 * Siembra los items del mundo por defecto
 * @param prisma Cliente de Prisma
 */
async function seedWorldItems(prisma: PrismaClient): Promise<void> {
  seedLogger.info('🧩 Creando items del mundo por defecto...');
  
  // Verificar si la tabla WorldItem existe
  if (await tableExists(prisma, 'WorldItem')) {
    // Crear items del mundo por defecto
    await prisma.worldItem.createMany({
      data: [
        {
          name: 'Espada de Luz',
          emoji: '⚔️',
          color: '#3b82f6',
          description: 'Espada legendaria que emite luz',
          shortcut: 'edl',
        },
        {
          name: 'Amuleto de Protección',
          emoji: '🔮',
          color: '#8b5cf6',
          description: 'Amuleto que protege contra la magia oscura',
          shortcut: 'adp',
        },
        {
          name: 'Grimorio Antiguo',
          emoji: '📕',
          color: '#ef4444',
          description: 'Libro de hechizos antiguos',
          shortcut: 'grim',
        },
      ],
    });
    
    seedLogger.info('✅ Items del mundo por defecto creados');
  } else {
    seedLogger.warn('⚠️ La tabla WorldItem no existe, saltando creación de items del mundo');
  }
}

/**
 * Siembra los lugares por defecto
 * @param prisma Cliente de Prisma
 */
async function seedPlaces(prisma: PrismaClient): Promise<void> {
  seedLogger.info('🏞️ Creando lugares por defecto...');
  
  // Verificar si la tabla Place existe
  if (await tableExists(prisma, 'Place')) {
    // Crear lugares por defecto
    await prisma.place.createMany({
      data: [
        {
          name: 'Bosque Encantado',
          emoji: '🌲',
          color: '#10b981',
          description: 'Un bosque lleno de criaturas mágicas',
          shortcut: 'be',
        },
        {
          name: 'Ciudad de Cristal',
          emoji: '🏙️',
          color: '#3b82f6',
          description: 'Una ciudad construida con cristales mágicos',
          shortcut: 'cdc',
        },
        {
          name: 'Montañas del Dragón',
          emoji: '🏔️',
          color: '#f59e0b',
          description: 'Montañas donde habitan los dragones',
          shortcut: 'mdd',
        },
      ],
    });
    
    seedLogger.info('✅ Lugares por defecto creados');
  } else {
    seedLogger.warn('⚠️ La tabla Place no existe, saltando creación de lugares');
  }
}

/**
 * Siembra los personajes por defecto
 * @param prisma Cliente de Prisma
 */
async function seedCharacters(prisma: PrismaClient): Promise<void> {
  seedLogger.info('👤 Creando personajes por defecto...');
  
  // Verificar si la tabla Character existe
  if (await tableExists(prisma, 'Character')) {
    // Crear personajes por defecto
    await prisma.character.createMany({
      data: [
        {
          name: 'Elric',
          emoji: '🧙‍♂️',
          color: '#8b5cf6',
          description: 'Mago poderoso y sabio',
          shortcut: 'elr',
        },
        {
          name: 'Lyra',
          emoji: '🏹',
          color: '#10b981',
          description: 'Arquera ágil y precisa',
          shortcut: 'lyr',
        },
        {
          name: 'Thorgar',
          emoji: '🛡️',
          color: '#f59e0b',
          description: 'Guerrero fuerte y valiente',
          shortcut: 'thor',
        },
      ],
    });
    
    seedLogger.info('✅ Personajes por defecto creados');
  } else {
    seedLogger.warn('⚠️ La tabla Character no existe, saltando creación de personajes');
  }
}