import type { Prisma, Tag } from '@prisma/client';

/**
 * 🗿 Modelo base de Tag, directamente desde Prisma.
 */
export type TagBase = Tag;

/**
 *  COUNTS
 * 🤖 Conteos de relaciones para la entidad Tag.
 * [Automáticamente generado por el asistente el 2025-01-27]
 */
export const TAG_COUNTS_RELATIONS = [
  'images',
  'videos',
  'albums',
  'collections',
  'characters',
  'places',
  'worldItems',
  'concepts',
  'prompts',
  'notes',
  'wildcards',
  'properties',
  'groups',
] as const;

/**
 * 🏭 Prisma `include` para conteos de Tag.
 */
export const tagCounts = {
  _count: {
    select: {
      images: true,
      videos: true,
      albums: true,
      collections: true,
      characters: true,
      places: true,
      worldItems: true,
      concepts: true,
      prompts: true,
      notes: true,
      wildcards: true,
      properties: true,
      groups: true,
    },
  },
} satisfies Prisma.TagInclude;

/**
 * 🤖 El tipo de un Tag de Prisma con sus conteos de relaciones.
 */
export type PrismaTagWithCounts = Prisma.TagGetPayload<{
  include: typeof tagCounts;
}>;

/**
 * 📊 Estadísticas calculadas para un Tag.
 */
export interface TagStatistics {
  totalRelations: number; // Suma de todas las relaciones
  usageDiversity: number; // Cuán distribuido está el uso del tag entre diferentes tipos de entidades
  popularity: number; // Un score de popularidad general
  completenessScore: number; // Qué tan completo está el perfil del tag (descripción, etc.)
}

/**
 * ✨ Modelo extendido de Tag con estadísticas.
 * Este es el tipo canónico que se debe usar en toda la aplicación.
 */
export interface TagWithStats extends TagBase {
  stats: TagStatistics;
}