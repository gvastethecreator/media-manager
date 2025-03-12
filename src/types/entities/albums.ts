import type { Image } from './images';

export interface Album {
	id: string;
	name: string;
	emoji: string;
	description?: string | null;
	color: string;
	shortcut?: string | null;
	sortBy?: string;
	filters?: string; // JSON string
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
