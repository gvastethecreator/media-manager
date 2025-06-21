import type { Prisma, Property } from '@prisma/client';

/**
 * 🗿 Modelo base de Property, directamente desde Prisma.
 */
export type PropertyBase = Property;

/**
 *  COUNTS
 * 🤖 Conteos de relaciones para la entidad Property.
 * [Automáticamente generado por el asistente el 2025-01-27]
 */
export const PROPERTY_COUNTS_RELATIONS = [
  'images',
  'videos',
  'albums',
  'collections',
  'tags',
  'characters',
  'places',
  'worldItems',
  'concepts',
  'prompts',
  'notes',
  'wildcards',
  'groups',
] as const;

/**
 * 🏭 Prisma `include` para conteos de Property.
 */
export const propertyCounts = {
  _count: {
    select: {
      images: true,
      videos: true,
      albums: true,
      collections: true,
      tags: true,
      characters: true,
      places: true,
      worldItems: true,
      concepts: true,
      prompts: true,
      notes: true,
      wildcards: true,
      groups: true,
    },
  },
} satisfies Prisma.PropertyInclude;

/**
 * 🤖 El tipo de una Property de Prisma con sus conteos de relaciones.
 */
export type PrismaPropertyWithCounts = Prisma.PropertyGetPayload<{
  include: typeof propertyCounts;
}>;

/**
 * 📊 Estadísticas calculadas para una Property.
 */
export interface PropertyStatistics {
  totalRelations: number; // Suma de todas las relaciones
  usageDiversity: number; // Cuán distribuido está el uso de la propiedad entre diferentes tipos de entidades
  popularity: number; // Un score de popularidad general
  completenessScore: number; // Qué tan completo está el perfil de la propiedad (descripción, etc.)
}

/**
 * ✨ Modelo extendido de Property con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface PropertyWithStats extends PropertyBase {
  stats: PropertyStatistics;
}