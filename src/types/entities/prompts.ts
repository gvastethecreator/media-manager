import type { Character } from './characters';
import type { Concept } from './concepts';
import type { Note } from './notes';
import type { Place } from './places';
import type { WorldItem } from './world-items';

export interface Prompt {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description?: string | null;
	content?: string;
	category?: string;
	parameters?: string; // JSON string
	tags?: string; // JSON string
	featuredImage?: string | null;
	isFavorite?: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;

	// Relaciones
	characters?: Character[];
	places?: Place[];
	worldItems?: WorldItem[];
	concepts?: Concept[];
	notes?: Note[];

	// Contadores
	_count?: {
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		notes?: number;
	};
}
