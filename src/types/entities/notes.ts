import type { Character } from './characters';
import type { Concept } from './concepts';
import type { Place } from './places';
import type { Prompt } from './prompts';
import type { WorldItem } from './world-items';

export interface Note {
	id: string;
	title: string;
	content: string;
	category?: string;
	priority?: number;
	status?: string;
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
	prompts?: Prompt[];

	// Contadores
	_count?: {
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
	};
}
