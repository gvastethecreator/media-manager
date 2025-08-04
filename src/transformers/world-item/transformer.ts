/**
 * @file Transformador principal para la entidad WorldItem.
 * @module transformers/world-item/transformer
 * @description Contiene la lógica para transformar datos de Drizzle a tipos canónicos de la aplicación.
 */

import type { WorldItemComplete, WorldItemStatistics } from '../../types/entities/world-item';

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
	images?: Array<{ id: string; name: string }>;
	videos?: Array<{ id: string; name: string }>;
	albums?: Array<{ id: string; name: string }>;
	collections?: Array<{ id: string; name: string }>;
	tags?: Array<{ id: string; name: string }>;
	characters?: Array<{ id: string; name: string }>;
	places?: Array<{ id: string; name: string }>;
	concepts?: Array<{ id: string; name: string }>;
	prompts?: Array<{ id: string; name: string }>;
	notes?: Array<{ id: string; content: string }>;
	wildcards?: Array<{ id: string; name: string }>;
	properties?: Array<{ key: string; value: unknown }>;
	groups?: Array<{ id: string; name: string }>;
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

	const totalRelations =
		(_count?.images ?? 0) +
		(_count?.videos ?? 0) +
		(_count?.characters ?? 0) +
		(_count?.places ?? 0) +
		(_count?.notes ?? 0) +
		(_count?.concepts ?? 0);

	const statistics: WorldItemStatistics = {
		// Conteos de relaciones
		imageCount: _count?.images ?? 0,
		videoCount: _count?.videos ?? 0,
		albumCount: _count?.albums ?? 0,
		collectionCount: _count?.collections ?? 0,
		tagCount: _count?.tags ?? 0,
		characterCount: _count?.characters ?? 0,
		placeCount: _count?.places ?? 0,
		conceptCount: _count?.concepts ?? 0,
		promptCount: _count?.prompts ?? 0,
		noteCount: _count?.notes ?? 0,
		wildcardCount: _count?.wildcards ?? 0,
		propertyCount: _count?.properties ?? 0,
		groupCount: _count?.groups ?? 0,

		// Métricas globales requeridas por EntityStats
		totalItems: totalRelations,
		totalAssociations: totalRelations,
		worldItemCount: 0, // No hay world items anidados en este contexto

		// Timestamps requeridos por EntityStats
		lastUpdated: baseData.updatedAt,
		lastViewed: undefined,
		lastModified: baseData.updatedAt,

		// Propiedades del sistema de archivos requeridas por EntityStats
		size: 0, // WorldItems no tienen tamaño físico
		mtime: baseData.updatedAt,
		birthtime: baseData.createdAt,
		type: baseData.type || 'world-item',
		isDirectory: false,
		isFile: false,

		// Métricas RPG
		powerLevel: 1,
		rarityScore: 50,
		completenessScore: 75,
		popularityScore: 25,
		hasDescription: !!baseData.description,
		hasAttributes: !!worldItem.attributes,
		hasEffects: !!worldItem.effects,
		hasRequirements: !!worldItem.requirements,
		hasStats: !!worldItem.stats,
		mediaRichness: (_count?.images ?? 0) + (_count?.videos ?? 0),
		createdThisMonth: false,
		updatedThisWeek: false,
		daysSinceCreation: 0,
		daysSinceLastUpdate: 0,
		totalAttributes: 0,
		totalEffects: 0,
		totalRequirements: 0,
		totalStats: 0,
		itemTier: 'common' as const,
	};

	return {
		...baseData,

		// Propiedades faltantes con valores por defecto
		emoji: null,
		color: null,
		materials: null,
		origin: null,
		uses: null,
		history: null,
		parentId: null,
		shortcut: null,

		// Propiedades requeridas por WorldItemBase
		totalImages: _count?.images ?? 0,
		totalVideos: _count?.videos ?? 0,

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

		// Propiedad notes como string
		notes: null,

		// Tipo de entidad
		entityType: 'world-item' as const,

		// Estadísticas calculadas
		statistics,
		stats: statistics,

		// Relaciones
		relations: {
			images: (worldItem.images || []).map((img) => img.id),
			videos: (worldItem.videos || []).map((vid) => vid.id),
			albums: (worldItem.albums || []).map((album) => album.id),
			collections: (worldItem.collections || []).map((collection) => collection.id),
			characters: (worldItem.characters || []).map((character) => character.id),
			places: (worldItem.places || []).map((place) => place.id),
			concepts: (worldItem.concepts || []).map((concept) => concept.id),
			prompts: (worldItem.prompts || []).map((prompt) => prompt.id),
			notes: (worldItem.notes || []).map((note) => note.id),
			wildcards: (worldItem.wildcards || []).map((wildcard) => wildcard.id),
			properties: (worldItem.properties || []).map((property) => property.key),
			groups: (worldItem.groups || []).map((group) => group.id),
		},

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
