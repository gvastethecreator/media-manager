/**
 * @file Tipos canónicos para la entidad Favorite
 * @module types/entities/favorite/types
 */

/**
 * ⭐ Enum para los tipos de entidades que pueden ser marcadas como favoritas.
 * Se utiliza tanto para validación de tipos como para valores en tiempo de ejecución.
 */
export enum FavoriteEntityType {
	IMAGE = 'image',
	ALBUM = 'album',
	COLLECTION = 'collection',
	FOLDER = 'folder',
	CHARACTER = 'character',
	PLACE = 'place',
	WORLD_ITEM = 'worldItem',
	CONCEPT = 'concept',
	PROMPT = 'prompt',
	NOTE = 'note',
}

/**
 * ⭐ Tipo base para un favorito.
 * Representa la estructura de un favorito en la base de datos.
 */
export interface FavoriteBase {
	id: string;
	entityId: string;
	entityType: FavoriteEntityType;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * ⭐ Input para crear un nuevo favorito.
 */
export type FavoriteCreateInput = Omit<FavoriteBase, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * ⭐ Relaciones de un favorito.
 * Por ahora, un favorito no tiene relaciones directas complejas.
 */
export type FavoriteRelations = {};

/**
 * ⭐ Tipo completo de un favorito con sus relaciones.
 */
export interface FavoriteComplete extends FavoriteBase, FavoriteRelations {}

// Alias para consistencia
export type CreateFavoriteData = FavoriteCreateInput;
