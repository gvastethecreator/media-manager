import type { Character } from './characters';
import type { Note } from './notes';
import type { Place } from './places';
import type { Prompt } from './prompts';
import type { WorldItem } from './world-items';

export interface Concept {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	content?: string;
	category?: string;
	tags?: string; // JSON string
	featuredImage?: string | null;
	isFavorite?: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;

	// Relaciones
	characters?: Character[];
	places?: Place[];
	worldItems?: WorldItem[];
	notes?: Note[];
	prompts?: Prompt[];

	// Contadores
	_count?: {
		characters?: number;
		places?: number;
		worldItems?: number;
		notes?: number;
		prompts?: number;
	};
}
