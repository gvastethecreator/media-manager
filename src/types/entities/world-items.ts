import type { Concept } from './concepts';
import type { Image } from './images';
import type { Note } from './notes';
import type { Prompt } from './prompts';

export interface WorldItem {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	type?: string | null;
	rarity?: string | null;
	properties: string; // JSON string of properties array
	requirements: string; // JSON string of requirements object
	origin?: string | null;
	stats: string; // JSON string of stats object
	sortBy?: string;
	filters?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	category?: string | null;
	createdAt: Date | string;
	updatedAt: Date | string;

	// Relaciones
	notes?: Note[];
	concepts?: Concept[];
	prompts?: Prompt[];
	images?: Image[];

	// Contadores
	_count?: {
		notes?: number;
		concepts?: number;
		prompts?: number;
		images?: number;
	};
}
