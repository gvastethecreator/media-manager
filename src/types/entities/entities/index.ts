/**
 * Tipos de entidades disponibles en la aplicación
 */
export enum EntityType {
	CONCEPT = 'concept',
	IMAGE = 'image',
	VIDEO = 'video',
	ALBUM = 'album',
	COLLECTION = 'collection',
	TAG = 'tag',
	USER = 'user',
	NOTE = 'note',
	PLACE = 'place',
	CHARACTER = 'character',
	WORLD_ITEM = 'world_item',
	PROMPT = 'prompt',
	PROPERTY = 'property',
	GROUP = 'group',
	WILDCARD = 'wildcard',
	FOLDER = 'folder',
	QUEUE_JOB = 'queue_job',
	PROFILE = 'profile',
	ACTIVITY = 'activity',
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

// Re-export for backwards compatibility
export { UploadedImageType } from '@/types/entities/uploaded-image';
