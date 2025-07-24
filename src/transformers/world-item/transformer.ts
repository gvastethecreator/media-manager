/**
 * @file Transformador principal para la entidad WorldItem.
 * @module transformers/world-item/transformer
 * @description Contiene la lógica para transformar datos de Drizzle a tipos canónicos de la aplicación.
 */

import type { WorldItemComplete } from '@/types/entities/world-item';
import { deserializeAttributes, deserializeEffects, deserializeFilters, deserializeRequirements } from './serializers';

// Tipos locales equivalentes a Drizzle
type DrizzleWorldItemFromDrizzle = {
	id: string;
	name: string;
	description: string | null;
	type: string;
	category: string;
	rarity: string;
	value: number | null;
	weight: number | null;
	featuredImage: string | null;
	attributes: string;
	effects: string;
	requirements: string;
	stats: string;
	propertiesJson: string;
	filters: string;
	tagsJson: string;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	images?: Array<{id: string; name: string}>;
	videos?: Array<{id: string; name: string}>;
	albums?: Array<{id: string; name: string}>;
	collections?: Array<{id: string; name: string}>;
	tags?: Array<{id: string; name: string}>;
	characters?: Array<{id: string; name: string}>;
	places?: Array<{id: string; name: string}>;
	concepts?: Array<{id: string; name: string}>;
	prompts?: Array<{id: string; name: string}>;
	notes?: Array<{id: string; content: string}>;
	wildcards?: Array<{id: string; name: string}>;
	properties?: Array<{key: string; value: unknown}>;
	groups?: Array<{id: string; name: string}>;
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
};

/**
 * 🔄 Transforma un objeto WorldItem de Drizzle a un WorldItemComplete.
 * @param worldItem - El objeto WorldItem obtenido de Drizzle.
 * @returns Un objeto WorldItemComplete.
 */
export function fromDrizzleWorldItem(worldItem: DrizzleWorldItemFromDrizzle | null): WorldItemComplete | null {
	if (!worldItem) return null;

	const { _count, tags: relationTags, properties: relationProperties, ...baseData } = worldItem;

	return {
		...baseData,

		// Propiedades faltantes con valores por defecto
		emoji: null,
		color: null,
		isPublic: false,
		totalImages: 0,
		totalVideos: 0,
		materials: null,
		origin: null,
		uses: null,
		history: null,
		parentId: null,
		shortcut: null,
		
		// Convertir value y weight de number a string
		value: baseData.value?.toString() || null,
		weight: baseData.weight?.toString() || null,

		// Deserialización de campos JSON - mantener como string según WorldItemComplete
		attributes: worldItem.attributes,
		effects: worldItem.effects,
		requirements: worldItem.requirements,

		// Deserialización de campos JSON renombrados
		properties: JSON.parse(worldItem.propertiesJson || '{}'),
		tags: JSON.parse(worldItem.tagsJson || '[]'),

		// Mapeo de relaciones - simplificado para evitar dependencias circulares
		images: (worldItem.images || []) as unknown as any[],
		videos: (worldItem.videos || []) as unknown as any[],
		albums: (worldItem.albums || []) as unknown as any[],
		collections: (worldItem.collections || []) as unknown as any[],
		characters: (worldItem.characters || []) as unknown as any[],
		places: (worldItem.places || []) as unknown as any[],
		concepts: (worldItem.concepts || []) as unknown as any[],
		prompts: (worldItem.prompts || []) as unknown as any[],
		notes: (worldItem.notes || []) as unknown as any[],
		wildcards: (worldItem.wildcards || []) as unknown as any[],
		groups: (worldItem.groups || []) as unknown as any[],

		// Las relaciones tags y properties ya están deserializadas arriba

		// Conteo de relaciones
		_count: {
			images: _count?.images ?? 0,
			videos: _count?.videos ?? 0,
			albums: _count?.albums ?? 0,
			collections: _count?.collections ?? 0,
			tags: _count?.tags ?? 0,
			characters: _count?.characters ?? 0,
			places: _count?.places ?? 0,
			concepts: _count?.concepts ?? 0,
			prompts: _count?.prompts ?? 0,
			notes: _count?.notes ?? 0,
			wildcards: _count?.wildcards ?? 0,
			properties: _count?.properties ?? 0,
			groups: _count?.groups ?? 0,
		},
	};
}

/**
 * 🔄 Transforma una lista de objetos WorldItem de Drizzle a un array de WorldItemComplete.
 * @param worldItems - Los objetos WorldItem obtenidos de Drizzle.
 * @returns Un array de objetos WorldItemComplete.
 */
export function fromDrizzleWorldItems(worldItems: DrizzleWorldItemFromDrizzle[]): WorldItemComplete[] {
	return worldItems.map(fromDrizzleWorldItem).filter((w): w is WorldItemComplete => w !== null);
}
