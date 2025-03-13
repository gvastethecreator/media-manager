import { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra las texturas por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedTextures(prisma: PrismaClient): Promise<void> {
  seedLogger.info('🎨 Creando texturas por defecto...');

  // Verificar si la tabla Texture existe
  if (await tableExists(prisma, 'Texture')) {
    // Lista de tipos de entidades que usan texturas
    const entityTypes = ['album', 'collection', 'tag', 'character', 'world-item', 'place', 'concept', 'prompt', 'note'];

    // Texturas comunes para todas las entidades
    const commonTextures = [
      {
        name: 'none',
        patternType: 'none',
        color: 'transparent',
        opacity: 0,
        description: 'Sin textura',
        blendMode: 'normal',
        noiseType: 'none',
        animated: false,
        density: 0,
        contrast: 1,
        visibleOnHover: false,
        layerOrder: 0,
      },
      {
        name: 'light_noise',
        patternType: 'noise',
        color: '#ffffff',
        opacity: 0.05,
        description: 'Ruido sutil de luz',
        blendMode: 'overlay',
        noiseType: 'light',
        animated: false,
        density: 0.3,
        contrast: 1.1,
        visibleOnHover: false,
        layerOrder: 1,
      },
      {
        name: 'paper',
        patternType: 'paper',
        color: '#f5f5f4',
        opacity: 0.1,
        description: 'Textura de papel',
        blendMode: 'multiply',
        noiseType: 'medium',
        animated: false,
        density: 0.5,
        contrast: 1.2,
        visibleOnHover: false,
        layerOrder: 2,
      },
      {
        name: 'canvas',
        patternType: 'canvas',
        color: '#e7e5e4',
        opacity: 0.15,
        description: 'Textura de lienzo',
        blendMode: 'overlay',
        noiseType: 'medium',
        animated: false,
        density: 0.6,
        contrast: 1.3,
        visibleOnHover: false,
        layerOrder: 3,
      },
      {
        name: 'metal',
        patternType: 'metal',
        color: '#94a3b8',
        opacity: 0.2,
        description: 'Textura metálica',
        blendMode: 'hard-light',
        noiseType: 'high',
        animated: true,
        animationSpeed: 0.5,
        density: 0.7,
        contrast: 1.5,
        visibleOnHover: false,
        layerOrder: 4,
      },
      {
        name: 'holographic',
        patternType: 'holographic',
        color: '#d8b4fe',
        opacity: 0.3,
        description: 'Textura holográfica',
        blendMode: 'screen',
        noiseType: 'complex',
        animated: true,
        animationSpeed: 1,
        density: 0.8,
        contrast: 1.7,
        visibleOnHover: false,
        layerOrder: 5,
      },
      {
        name: 'glitter',
        patternType: 'glitter',
        color: '#ffffff',
        opacity: 0.25,
        description: 'Textura de brillo/glitter',
        blendMode: 'screen',
        noiseType: 'sparkle',
        animated: true,
        animationSpeed: 1.5,
        density: 0.9,
        contrast: 2,
        visibleOnHover: false,
        layerOrder: 6,
      },
      {
        name: 'wood',
        patternType: 'wood',
        color: '#a16207',
        opacity: 0.2,
        description: 'Textura de madera',
        blendMode: 'multiply',
        noiseType: 'pattern',
        animated: false,
        density: 0.6,
        contrast: 1.4,
        visibleOnHover: false,
        layerOrder: 7,
      },
      {
        name: 'marble',
        patternType: 'marble',
        color: '#f8fafc',
        opacity: 0.25,
        description: 'Textura de mármol',
        blendMode: 'overlay',
        noiseType: 'subtle',
        animated: false,
        density: 0.5,
        contrast: 1.3,
        visibleOnHover: false,
        layerOrder: 8,
      },
      {
        name: 'cosmic',
        patternType: 'cosmic',
        color: '#0f172a',
        opacity: 0.3,
        description: 'Textura cósmica',
        blendMode: 'screen',
        noiseType: 'complex',
        animated: true,
        animationSpeed: 0.8,
        density: 0.7,
        contrast: 1.8,
        visibleOnHover: false,
        layerOrder: 9,
      },
    ];

    // Crear las texturas para cada tipo de entidad
    for (const entityType of entityTypes) {
      // Crear registros de textura para este tipo de entidad
      for (const texture of commonTextures) {
        // Usar upsert en lugar de create para evitar conflictos
        await prisma.texture.upsert({
          where: {
            // Especificar ambos campos directamente
            entityType_name: {
              entityType: entityType,
              name: texture.name
            }
          },
          update: {
            // Actualizar los campos si ya existe
            ...texture
          },
          create: {
            // Crear nuevo registro si no existe
            entityType,
            ...texture
          }
        });
      }
    }

    seedLogger.info('✅ Texturas creadas correctamente');
  } else {
    seedLogger.warn('⚠️ La tabla Texture no existe, omitiendo...');
  }
}