import type { Concept } from './concepts';
import type { Image } from './images';
import type { Note } from './notes';
import type { Prompt } from './prompts';

export interface Character {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	shortcut?: string | null;
	level?: number;
	class?: string;
	race?: string;
	alignment?: string;
	backstory?: string;
	stats?: string; // JSON string
	sortBy?: string;
	filters?: string; // JSON string
	psychologicalProfile?: string;
	socialProfile?: string;
	relationships?: string; // JSON string
	goals?: string; // JSON string
	fears?: string; // JSON string
	beliefs?: string; // JSON string
	personality?: string; // JSON string
	featuredImage?: string | null;
	isFavorite?: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
	category?: string | null;

	// Relaciones
	images?: Image[];
	relatedCharacters?: Character[];
	relatedTo?: Character[];
	notes?: Note[];
	concepts?: Concept[];
	prompts?: Prompt[];

	// Contadores
	_count?: {
		images?: number;
		relatedCharacters?: number;
		relatedTo?: number;
		notes?: number;
		concepts?: number;
		prompts?: number;
	};
}
