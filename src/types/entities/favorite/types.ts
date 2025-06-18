/**
 * ⭐ Tipos canónicos y extendidos para la entidad Favorite
 *
 * - Este archivo contiene todos los tipos base, extendidos, enums e inputs para Favorite.
 * - Usar SIEMPRE estos tipos en transformers, services y server actions.
 * - No usar ni importar tipos de base.ts, extended.ts ni archivos legacy (eliminados).
 *
 * Estructura:
 * - FavoriteBase: tipo canónico principal
 * - FavoriteRelations: relaciones con otras entidades (any[] si no existen tipos canónicos)
 * - FavoriteCreateInput, FavoriteUpdateInput: inputs para mutaciones
 * - FavoriteEntityType: enum de tipos de entidad favorita
 * - FavoriteExtended, FavoritesByType, FavoriteStats: tipos extendidos para UI y lógica
 *
 * 🛡️ Todos los campos clave (id, createdAt, updatedAt) son obligatorios.
 * 📝 Documenta cualquier cambio relevante aquí.
 */

export type FavoriteBase = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  entityId?: string;
  entityType?: string;
  userId?: string;
  // otros campos base
};

export type FavoriteRelations = {
  // relaciones con otras entidades
};

export type FavoriteCreateInput = Omit<FavoriteBase, 'id' | 'createdAt' | 'updatedAt'>;
export type FavoriteUpdateInput = Partial<Omit<FavoriteBase, 'id'>>;

/**
 * Enum de tipos de entidad favorita
 */
export const FavoriteEntityType = {
  IMAGE: 'image',
  ALBUM: 'album',
  COLLECTION: 'collection',
  FOLDER: 'folder',
  CHARACTER: 'character',
  PLACE: 'place',
  WORLD_ITEM: 'worldItem',
  CONCEPT: 'concept',
  PROMPT: 'prompt',
  NOTE: 'note',
} as const;
export type FavoriteEntityType = (typeof FavoriteEntityType)[keyof typeof FavoriteEntityType];

/**
 * Tipos extendidos para UI y lógica
 */
export interface FavoriteExtended extends FavoriteBase {
  entityName?: string;
  entityPreview?: string;
  entityIcon?: string;
  entityColor?: string;
  isSelected?: boolean;
  isHovered?: boolean;
  _count?: {
    relatedEntities?: number;
  };
}

export interface FavoritesByType {
  type: string;
  displayName: string;
  icon: string;
  color: string;
  count: number;
  items: FavoriteExtended[];
}

export interface FavoriteStats {
  totalCount: number;
  byType: Record<string, number>;
  recentlyAdded: FavoriteExtended[];
}