/**
 * @file Definición de esquemas y tipos básicos para entidades
 * @module types/common/base
 */

import { z } from 'zod';

/**
 * Esquema base para todas las entidades
 */
export const BaseEntitySchema = z.object({
  id: z.string().cuid("El ID debe ser un CUID válido").optional(),
  emoji: z.string().optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Color debe ser un valor hexadecimal válido (#RRGGBB o #RGB)").optional(),
  isFavorite: z.boolean().default(false),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

/**
 * Tipo base para todas las entidades
 */
export interface BaseEntity {
  id: string;
  emoji?: string;
  color?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Esquema para campos de relación
 */
export const RelationSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Tipo para campos de relación
 */
export interface RelationField {
  id: string;
}

/**
 * Esquema para campos UI comunes
 */
export const UISchema = z.object({
  isSelected: z.boolean().default(false).optional(),
  isExpanded: z.boolean().default(false).optional(),
  isEditing: z.boolean().default(false).optional(),
  isHighlighted: z.boolean().default(false).optional(),
});

/**
 * Tipo para campos UI comunes
 */
export interface UIFields {
  isSelected?: boolean;
  isExpanded?: boolean;
  isEditing?: boolean;
  isHighlighted?: boolean;
}

/**
 * Esquema para campos de metadatos
 */
export const MetadataSchema = z.record(z.string(), z.unknown()).optional();

/**
 * Tipo para campos de metadatos
 */
export type MetadataFields = Record<string, unknown> | undefined;