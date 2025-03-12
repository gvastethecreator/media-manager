import type { Image } from './images';

export interface Tag {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	featuredImage?: string | null;
	isFavorite?: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
	category?: string | null;
	rarity?: string | null;
	texture?: string | null;

	// Relaciones
	images?: Image[];

	// Contadores
	_count?: {
		images?: number;
	};
}
