/**
 * Tipos de entidades disponibles en la aplicación
 */
export enum EntityType {
  CONCEPT = 'concept',
  IMAGE = 'image',
  ALBUM = 'album',
  COLLECTION = 'collection',
  TAG = 'tag',
  USER = 'user',
}

/**
 * Interface genérica para cualquier entidad base en el sistema
 */
export interface EntityBase {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface para una relación entre entidades
 */
export interface EntityRelation {
  id: string;
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  createdAt: Date;
}