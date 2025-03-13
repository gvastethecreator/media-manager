import { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra los prompts por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedPrompts(prisma: PrismaClient): Promise<void> {
  seedLogger.info('🎯 Creando prompts por defecto...');

  // Verificar si la tabla Prompt existe
  if (await tableExists(prisma, 'Prompt')) {
    // Crear prompts por defecto
    await prisma.prompt.createMany({
      data: [
        {
          name: 'Retrato Fantasy',
          emoji: '🧙',
          color: '#3b82f6',
          description: 'Prompt para generar retratos de personajes de fantasía',
          content: 'Full portrait of a [character type] with [distinguishing features], fantasy style, detailed clothing, [color scheme], dramatic lighting, [pose], fantasy background, high detail, trending on artstation',
          category: 'personajes',
          parameters: JSON.stringify({
            strength: 0.75,
            steps: 30,
            seed: -1,
            sampler: 'DPM++ 2M Karras',
          }),
          tags: JSON.stringify(['retrato', 'fantasía', 'personaje']),
        },
        {
          name: 'Paisaje Épico',
          emoji: '🏔️',
          color: '#10b981',
          description: 'Prompt para generar paisajes épicos',
          content: 'Breathtaking [landscape type] landscape, [time of day], [weather conditions], [color palette], cinematic, ultra-detailed, epic scale, dramatic lighting, volumetric fog, 8k resolution, trending on artstation',
          category: 'paisajes',
          parameters: JSON.stringify({
            strength: 0.8,
            steps: 35,
            seed: -1,
            sampler: 'Euler a',
          }),
          tags: JSON.stringify(['paisaje', 'épico', 'escenario']),
        },
        {
          name: 'Concept Art',
          emoji: '🎨',
          color: '#8b5cf6',
          description: 'Prompt para generar arte conceptual',
          content: 'Concept art of [subject], [art style], detailed environment, [atmosphere], professional quality, highly detailed, trending on artstation, by [famous artist]',
          category: 'arte',
          parameters: JSON.stringify({
            strength: 0.7,
            steps: 28,
            seed: -1,
            sampler: 'DPM++ SDE Karras',
          }),
          tags: JSON.stringify(['concept art', 'diseño', 'ilustración']),
        },
        {
          name: 'Objeto Mágico',
          emoji: '✨',
          color: '#f59e0b',
          description: 'Prompt para generar objetos mágicos y artefactos',
          content: 'Magical [object type], [material], intricate details, [color scheme], glowing runes, [magical effect], dark background, studio lighting, 4k, highly detailed',
          category: 'objetos',
          parameters: JSON.stringify({
            strength: 0.65,
            steps: 25,
            seed: -1,
            sampler: 'DDIM',
          }),
          tags: JSON.stringify(['objeto', 'artefacto', 'mágico']),
        },
        {
          name: 'Criatura Fantástica',
          emoji: '🐉',
          color: '#ef4444',
          description: 'Prompt para generar criaturas fantásticas',
          content: 'Highly detailed fantasy [creature type], [distinctive features], [environment], dynamic pose, [lighting conditions], epic composition, cinematic, intricate details, 8k, by [artist style]',
          category: 'criaturas',
          parameters: JSON.stringify({
            strength: 0.72,
            steps: 32,
            seed: -1,
            sampler: 'DPM2',
          }),
          tags: JSON.stringify(['criatura', 'fantasía', 'monstruo']),
        },
      ],
    });
    seedLogger.info('✅ Prompts creados correctamente');
  } else {
    seedLogger.warn('⚠️ La tabla Prompt no existe, omitiendo...');
  }
}