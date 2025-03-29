import type { PrismaClient } from '@prisma/client';
import { seedLogger, tableExists } from './utils.seed';

export async function seedProperties(prisma: PrismaClient): Promise<void> {
  seedLogger.info('🔍 Creando propiedades por defecto...');

  try {
    if (await tableExists(prisma, 'Property')) {
      const propertiesData = [
        // Propiedades de personajes
        {
          name: 'Nivel de Poder',
          emoji: '⚡',
          color: '#f59e0b',
          description: 'Nivel de poder del personaje o entidad',
          category: 'character',
          type: 'number',
          defaultValue: '1',
          options: JSON.stringify(['1', '10', '20', '30', '40', '50']),
          validation: JSON.stringify({
            min: 1,
            max: 50,
            step: 1
          })
        },
        {
          name: 'Alineamiento',
          emoji: '⚖️',
          color: '#8b5cf6',
          description: 'Orientación moral y ética',
          category: 'character',
          type: 'select',
          defaultValue: 'Neutral',
          options: JSON.stringify([
            'Lawful Good', 'Neutral Good', 'Chaotic Good',
            'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
            'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
          ])
        },
        {
          name: 'Clase',
          emoji: '🎭',
          color: '#ef4444',
          description: 'Clase o profesión del personaje',
          category: 'character',
          type: 'select',
          defaultValue: 'Guerrero',
          options: JSON.stringify([
            'Warrior', 'Mage', 'Rogue', 'Cleric',
            'Paladin', 'Druid', 'Warlock', 'Assassin',
            'Necromancer', 'Berserker'
          ])
        },
        // Propiedades de lugares
        {
          name: 'Tipo de Lugar',
          emoji: '🗺️',
          color: '#10b981',
          description: 'Categoría del lugar o ubicación',
          category: 'place',
          type: 'select',
          defaultValue: 'Ciudad',
          options: JSON.stringify([
            'Ciudad', 'Ruinas', 'Bosque', 'Montaña',
            'Dungeon', 'Templo', 'Fortaleza', 'Portal',
            'Biblioteca', 'Cripta'
          ])
        },
        {
          name: 'Nivel de Peligro',
          emoji: '⚠️',
          color: '#dc2626',
          description: 'Nivel de amenaza del lugar',
          category: 'place',
          type: 'select',
          defaultValue: 'Bajo',
          options: JSON.stringify([
            'Seguro', 'Bajo', 'Moderado', 'Alto',
            'Muy Alto', 'Extremo', 'Mortal'
          ])
        },
        // Propiedades de objetos
        {
          name: 'Rareza',
          emoji: '💎',
          color: '#6366f1',
          description: 'Rareza del objeto o artefacto',
          category: 'item',
          type: 'select',
          defaultValue: 'Común',
          options: JSON.stringify([
            'Común', 'Poco Común', 'Raro',
            'Muy Raro', 'Legendario', 'Artefacto'
          ])
        },
        {
          name: 'Tipo de Objeto',
          emoji: '🗡️',
          color: '#9ca3af',
          description: 'Categoría del objeto',
          category: 'item',
          type: 'select',
          defaultValue: 'Arma',
          options: JSON.stringify([
            'Arma', 'Armadura', 'Accesorio', 'Poción',
            'Grimorio', 'Reliquia', 'Herramienta', 'Consumible'
          ])
        },
        // Propiedades de conceptos
        {
          name: 'Escuela de Magia',
          emoji: '✨',
          color: '#8b5cf6',
          description: 'Tipo de magia o poder místico',
          category: 'concept',
          type: 'select',
          defaultValue: 'Evocación',
          options: JSON.stringify([
            'Evocación', 'Conjuración', 'Adivinación',
            'Alteración', 'Ilusión', 'Necromancia',
            'Piromancia', 'Druidismo'
          ])
        },
        {
          name: 'Origen del Conocimiento',
          emoji: '📚',
          color: '#6b7280',
          description: 'Fuente del conocimiento o poder',
          category: 'concept',
          type: 'select',
          defaultValue: 'Arcano',
          options: JSON.stringify([
            'Arcano', 'Divino', 'Natural', 'Prohibido',
            'Ancestral', 'Abisal', 'Primordial'
          ])
        },
        // Propiedades generales
        {
          name: 'Estado',
          emoji: '🔄',
          color: '#3b82f6',
          description: 'Estado actual de la entidad',
          category: 'general',
          type: 'select',
          defaultValue: 'Activo',
          options: JSON.stringify([
            'Activo', 'Inactivo', 'En Desarrollo',
            'Completado', 'Abandonado', 'Sellado'
          ])
        },
        {
          name: 'Importancia',
          emoji: '⭐',
          color: '#f59e0b',
          description: 'Nivel de importancia en la narrativa',
          category: 'general',
          type: 'select',
          defaultValue: 'Media',
          options: JSON.stringify([
            'Muy Baja', 'Baja', 'Media',
            'Alta', 'Muy Alta', 'Crucial'
          ])
        }
      ];

      for (const property of propertiesData) {
        const existingProperty = await prisma.property.findFirst({
          where: { name: property.name }
        });

        if (!existingProperty) {
          await prisma.property.create({
            data: property
          });
        }
      }

      seedLogger.info('✅ Propiedades creadas correctamente');
    } else {
      seedLogger.warn('⚠️ La tabla Property no existe, omitiendo...');
    }
  } catch (error) {
    seedLogger.error('❌ Error creando propiedades:', error);
    throw error;
  }
}