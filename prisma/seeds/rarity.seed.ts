import { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra las rarezas por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedRarities(prisma: PrismaClient): Promise<void> {
  seedLogger.info('✨ Creando rarezas por defecto...');

  // Verificar si la tabla Rarity existe
  if (await tableExists(prisma, 'Rarity')) {
    // Lista de tipos de entidades que usan rarezas
    const entityTypes = ['album', 'collection', 'tag', 'character', 'world-item', 'place', 'concept', 'prompt', 'note'];

    // Rarezas comunes para todas las entidades
    const commonRarities = [
      {
        name: 'common',
        color: '#9ca3af', // gray-400
        borderEffect: 'solid',
        borderWidth: 1,
        borderPattern: 'solid',
        borderAnimation: 'none',
        glowColor: '#9ca3af33',
        glowIntensity: 0,
        glowSize: 0,
        badgeClass: 'bg-gray-400',
        barClass: 'bg-gray-400',
        description: 'Rareza común sin efectos especiales',
        position: 0,
        chance: 70,
        specialEffects: JSON.stringify({}),
      },
      {
        name: 'uncommon',
        color: '#22c55e', // green-500
        borderEffect: 'solid',
        borderWidth: 1.5,
        borderPattern: 'solid',
        borderAnimation: 'pulse',
        glowColor: '#22c55e33',
        glowIntensity: 2,
        glowSize: 10,
        badgeClass: 'bg-green-500',
        barClass: 'bg-green-500',
        description: 'Rareza poco común con efectos sutiles',
        position: 1,
        chance: 15,
        specialEffects: JSON.stringify({ pulse: { speed: 1.5, intensity: 0.2 } }),
      },
      {
        name: 'rare',
        color: '#3b82f6', // blue-500
        borderEffect: 'gradient',
        borderWidth: 2,
        borderPattern: 'solid',
        borderAnimation: 'pulse',
        glowColor: '#3b82f633',
        glowIntensity: 3,
        glowSize: 15,
        badgeClass: 'bg-blue-500',
        barClass: 'bg-blue-500',
        description: 'Rareza rara con efectos de brillo',
        position: 2,
        chance: 10,
        specialEffects: JSON.stringify({ pulse: { speed: 2, intensity: 0.3 } }),
      },
      {
        name: 'epic',
        color: '#8b5cf6', // purple-500
        borderEffect: 'gradient',
        borderWidth: 2.5,
        borderPattern: 'dashed',
        borderAnimation: 'flow',
        glowColor: '#8b5cf666',
        glowIntensity: 4,
        glowSize: 20,
        badgeClass: 'bg-purple-500',
        barClass: 'bg-purple-500',
        description: 'Rareza épica con efectos visuales avanzados',
        position: 3,
        chance: 4,
        specialEffects: JSON.stringify({ particleEffect: true, flow: { speed: 3, intensity: 0.5 } }),
      },
      {
        name: 'legendary',
        color: '#f59e0b', // amber-500
        borderEffect: 'rainbow',
        borderWidth: 3,
        borderPattern: 'gradient',
        borderAnimation: 'rainbow-flow',
        glowColor: '#f59e0b99',
        glowIntensity: 5,
        glowSize: 30,
        badgeClass: 'bg-amber-500',
        barClass: 'bg-amber-500 animate-pulse',
        description: 'Rareza legendaria con efectos visuales impresionantes',
        position: 4,
        chance: 1,
        specialEffects: JSON.stringify({
          particleEffect: true,
          rainbow: { speed: 2, intensity: 0.8 },
          halo: { color: '#f59e0b66', size: 20 }
        }),
      },
    ];

    // Crear las rarezas para cada tipo de entidad
    for (const entityType of entityTypes) {
      // Crear registros de rareza para este tipo de entidad
      for (const rarity of commonRarities) {
        // Usar upsert en lugar de create para evitar conflictos
        await prisma.rarity.upsert({
          where: {
            // Especificar ambos campos directamente
            entityType_name: {
              entityType: entityType,
              name: rarity.name
            }
          },
          update: {
            // Actualizar los campos si ya existe
            ...rarity
          },
          create: {
            // Crear nuevo registro si no existe
            entityType,
            ...rarity
          }
        });
      }
    }

    seedLogger.info('✅ Rarezas creadas correctamente');
  } else {
    seedLogger.warn('⚠️ La tabla Rarity no existe, omitiendo...');
  }
}