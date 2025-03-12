import type { Image } from './images';

export interface Collection {
	id: string;
	name: string;
	emoji: string;
	description?: string | null;
	color: string;
	shortcut?: string | null;
	sortBy?: string;
	filters?: string; // JSON string
	url?: string | null;
	alternativeUrl?: string | null;
	sourceImage?: string | null;
	platform?: string | null;
	price?: number | null;
	editions?: string; // JSON string
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
