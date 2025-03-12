import type { Concept } from './concepts';
import type { Image } from './images';
import type { Note } from './notes';
import type { Prompt } from './prompts';

export interface Place {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	region?: string;
	type?: string;
	climate?: string;
	population?: number;
	government?: string;
	dangers?: string; // JSON string
	resources?: string; // JSON string
	lore?: string;
	history?: string;
	stats?: string; // JSON string
	sortBy?: string;
	filters?: string; // JSON string
	featuredImage?: string | null;
	isFavorite?: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
	category?: string | null;

	// Relaciones
	images?: Image[];
	notes?: Note[];
	concepts?: Concept[];
	prompts?: Prompt[];

	// Contadores
	_count?: {
		images?: number;
		notes?: number;
		concepts?: number;
		prompts?: number;
	};
}
