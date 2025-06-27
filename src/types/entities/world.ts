/**
 * @file Tipos canónicos para la entidad World
 * @module types/entities/world
 * @description Define las estructuras de datos, inputs y tipos para la entidad World.
 */

/**
 * Tipo base canónico para World
 */
export interface World {
	id: string;
	name: string;
	description: string | null;
	coverImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Tipo para items en listados de mundos
 */
export interface WorldListItem {
	id: string;
	name:string;
	coverImage: string | null;
	isFavorite: boolean;
	itemType: 'world';
}

/**
 * Tipo completo con relaciones (si las tuviera en el futuro)
 */
export interface WorldComplete extends World {
	// Future relations can be added here
}

/**
 * Input para crear un nuevo mundo
 */
export interface WorldCreateInput {
	name: string;
	description?: string | null;
	coverImage?: string | null;
	isFavorite?: boolean;
}

/**
 * Input para actualizar un mundo
 */
export type WorldUpdateInput = Partial<WorldCreateInput>;
