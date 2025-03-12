import { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

/**
 * Siembra las entidades de contenido (concept, prompt, note) por defecto en la base de datos
 * @param prisma Cliente de Prisma
 */
export async function seedContentEntities(prisma: PrismaClient): Promise<void> {
  // Concepts
  await seedConcepts(prisma);
  
  // Prompts
  await seedPrompts(prisma);
  
  // Notes
  await seedNotes(prisma);
}

/**
 * Siembra los conceptos por defecto
 * @param prisma Cliente de Prisma
 */
async function seedConcepts(prisma: PrismaClient): Promise<void> {
  seedLogger.info('💭 Creando conceptos por defecto...');
  
  // Verificar si la tabla Concept existe
  if (await tableExists(prisma, 'Concept')) {
    // Crear conceptos por defecto
    await prisma.concept.createMany({
      data: [
        {
          name: 'Magia Elemental',
          emoji: '🔮',
          color: '#8b5cf6',
          description: 'Sistema de magia basado en los elementos',
          shortcut: 'mel',
        },
        {
          name: 'Tecnología Arcana',
          emoji: '⚙️',
          color: '#3b82f6',
          description: 'Fusión de tecnología y magia',
          shortcut: 'teca',
        },
      ],
    });
    
    seedLogger.info('✅ Conceptos por defecto creados');
  } else {
    seedLogger.warn('⚠️ La tabla Concept no existe, saltando creación de conceptos');
  }
}

/**
 * Siembra los prompts por defecto
 * @param prisma Cliente de Prisma
 */
async function seedPrompts(prisma: PrismaClient): Promise<void> {
  seedLogger.info('📝 Creando prompts por defecto...');
  
  // Verificar si la tabla Prompt existe
  if (await tableExists(prisma, 'Prompt')) {
    // Crear prompts por defecto
    await prisma.prompt.createMany({
      data: [
        {
          name: 'Paisaje Fantástico',
          emoji: '🏞️',
          color: '#10b981',
          description: 'Prompt para generar paisajes fantásticos',
          shortcut: 'pf',
          content: 'Un paisaje fantástico con montañas flotantes, cascadas de luz y criaturas mágicas volando en el cielo.',
        },
        {
          name: 'Retrato Estilo Anime',
          emoji: '👤',
          color: '#8b5cf6',
          description: 'Prompt para generar retratos en estilo anime',
          shortcut: 'rea',
          content: 'Retrato detallado de un personaje en estilo anime, con grandes ojos expresivos, cabello colorido y fondo abstracto.',
        },
      ],
    });
    
    seedLogger.info('✅ Prompts por defecto creados');
  } else {
    seedLogger.warn('⚠️ La tabla Prompt no existe, saltando creación de prompts');
  }
}

/**
 * Siembra las notas por defecto
 * @param prisma Cliente de Prisma
 */
async function seedNotes(prisma: PrismaClient): Promise<void> {
  seedLogger.info('📒 Creando notas por defecto...');
  
  // Verificar si la tabla Note existe
  if (await tableExists(prisma, 'Note')) {
    // Crear notas por defecto
    await prisma.note.createMany({
      data: [
        {
          name: 'Ideas para Proyectos',
          emoji: '💡',
          color: '#f59e0b',
          description: 'Lista de ideas para futuros proyectos',
          shortcut: 'idp',
          content: '# Ideas para Proyectos\n\n- Crear una serie de paisajes fantásticos\n- Diseñar personajes para una historia\n- Experimentar con nuevos estilos artísticos',
        },
        {
          name: 'Técnicas de Composición',
          emoji: '🎨',
          color: '#3b82f6',
          description: 'Notas sobre técnicas de composición',
          shortcut: 'tec',
          content: '# Técnicas de Composición\n\n## Regla de los Tercios\n\nDividir la imagen en una cuadrícula de 3x3 y colocar elementos importantes en las intersecciones.\n\n## Líneas Guía\n\nUsar líneas para dirigir la mirada del espectador hacia el punto focal.',
        },
      ],
    });
    
    seedLogger.info('✅ Notas por defecto creadas');
  } else {
    seedLogger.warn('⚠️ La tabla Note no existe, saltando creación de notas');
  }
}