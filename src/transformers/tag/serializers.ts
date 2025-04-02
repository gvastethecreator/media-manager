/**
 * @file Funciones para serializar y deserializar datos de etiquetas
 * @module transformers/tag/serializers
 */

import { Logger } from '@/lib/logger';
import { serverLogger } from '@/lib/logger/server-logger';
import {
    type TagCreateInput,
    TagSchema,
    type TagUpdateInput,
} from '@/types/entities/tag/types';
import {
    validateFieldType,
    validateRequiredFields
} from '@/utils/transformers/common';
import { handleTransformerError } from '@/utils/transformers/errors';
import {
    getRelationCounts,
    preparePrismaRelations,
    validateEntityRelations,
} from '@/utils/transformers/relations';
import {
    validateBaseEntity,
    validateMetadataFields,
    validateUIFields,
} from '@/utils/transformers/validation';
import type { Prisma } from '@prisma/client';
import { type TagBase, TagCategory, type TagComplete, type TagExtended, type TagWithStats } from '../../types/entities/tag/index';

// Logger específico para serializadores de Tag
const serializerLogger = serverLogger.withContext('TagSerializers');

// Valores por defecto
export const DEFAULT_TAG_EMOJI = '🏷️';
export const DEFAULT_TAG_COLOR = '#6b7280'; // Color neutral por defecto

// Opciones de transformación (similares a otros módulos)
export interface TagTransformOptions {
	validateFields?: boolean;
	deserializeFields?: boolean;
	includeRelations?: boolean;
	includeUI?: boolean;
	includeStats?: boolean;
}

const logger = new Logger('TagSerializer');

/**
 * 🔄 Serializa un Tag para Prisma
 */
export function toPrismaTag(data: TagCreateInput | TagUpdateInput): Prisma.TagCreateInput | Prisma.TagUpdateInput {
	try {
		// Validar campos requeridos para creación
		if (!('id' in data)) {
			validateRequiredFields(data, ['name']);
		}

		// Validar tipos de datos
		validateFieldType(data.name, 'string', 'name');
		if (data.emoji) validateFieldType(data.emoji, 'string', 'emoji');
		if (data.color) validateFieldType(data.color, 'string', 'color');
		if (data.category) validateFieldType(data.category, 'string', 'category');

		// Preparar relaciones para Prisma
		const relations = preparePrismaRelations('Tag', data);

		return {
			...data,
			...relations,
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Deserializa un Tag desde Prisma
 */
export function fromPrismaTag(
	prismaTag: Prisma.TagGetPayload<{
		include: {
			images: true;
			videos: true;
			albums: true;
			collections: true;
			characters: true;
			places: true;
			worldItems: true;
			concepts: true;
			prompts: true;
			notes: true;
			wildcards: true;
			properties: true;
			groups: true;
			_count: true;
		};
	}>
): TagComplete {
	try {
		// Obtener conteos de relaciones
		const counts = getRelationCounts('Tag', prismaTag);

		// Construir objeto base
		const baseTag: TagBase = {
			id: prismaTag.id,
			name: prismaTag.name,
			emoji: prismaTag.emoji,
			color: prismaTag.color,
			description: prismaTag.description,
			shortcut: prismaTag.shortcut,
			category: prismaTag.category,
			featuredImage: prismaTag.featuredImage,
			isFavorite: prismaTag.isFavorite,
			createdAt: prismaTag.createdAt,
			updatedAt: prismaTag.updatedAt,
		};

		// Validar objeto base
		validateBaseEntity(baseTag);
		validateUIFields(baseTag);
		validateMetadataFields(baseTag);

		// Construir objeto completo con relaciones
		return {
			...baseTag,
			images: prismaTag.images?.map(img => ({ id: img.id })),
			videos: prismaTag.videos?.map(vid => ({ id: vid.id })),
			albums: prismaTag.albums?.map(alb => ({ id: alb.id })),
			collections: prismaTag.collections?.map(col => ({ id: col.id })),
			characters: prismaTag.characters?.map(char => ({ id: char.id })),
			places: prismaTag.places?.map(place => ({ id: place.id })),
			worldItems: prismaTag.worldItems?.map(item => ({ id: item.id })),
			concepts: prismaTag.concepts?.map(con => ({ id: con.id })),
			prompts: prismaTag.prompts?.map(prompt => ({ id: prompt.id })),
			notes: prismaTag.notes?.map(note => ({ id: note.id })),
			wildcards: prismaTag.wildcards?.map(wild => ({ id: wild.id })),
			properties: prismaTag.properties?.map(prop => ({ id: prop.id })),
			groups: prismaTag.groups?.map(group => ({ id: group.id })),
			_count: counts,
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔍 Valida un Tag
 */
export function validateTag(data: unknown): TagComplete {
	try {
		const validated = TagSchema.parse(data);
		validateEntityRelations('Tag', validated);
		return validated as TagComplete;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Extiende un Tag con datos adicionales
 */
export async function extendTag(
	tag: TagComplete,
	options: {
		includeRelations?: boolean;
		includeCount?: boolean;
		customFields?: string[];
	} = {}
): Promise<TagComplete> {
	try {
		const extended = { ...tag };

		// Aquí puedes agregar lógica para cargar datos adicionales
		// basado en las opciones proporcionadas

		return extended;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔍 Parsea filtros de Tag
 */
export function parseTagFilters(filters: unknown): Record<string, unknown> {
	try {
		if (!filters || typeof filters !== 'object') {
			return {};
		}

		const parsed: Record<string, unknown> = {};
		const typedFilters = filters as Record<string, unknown>;

		// Procesar filtros específicos de Tag
		if (typedFilters.search) {
			parsed.OR = [
				{ name: { contains: typedFilters.search as string, mode: 'insensitive' } },
				{ description: { contains: typedFilters.search as string, mode: 'insensitive' } },
			];
		}

		// Filtros de categoría
		if (typedFilters.categories?.length) {
			parsed.category = { in: typedFilters.categories };
		}

		// Filtros de estado
		if (typedFilters.isFavorite !== undefined) {
			parsed.isFavorite = typedFilters.isFavorite;
		}

		// Filtros de relaciones
		if (typedFilters.hasImages) {
			parsed.images = { some: {} };
		}
		if (typedFilters.hasVideos) {
			parsed.videos = { some: {} };
		}
		if (typedFilters.hasAlbums) {
			parsed.albums = { some: {} };
		}
		if (typedFilters.hasCollections) {
			parsed.collections = { some: {} };
		}

		// Filtros de fecha
		if (typedFilters.dateRange?.start) {
			parsed.createdAt = { ...parsed.createdAt, gte: typedFilters.dateRange.start };
		}
		if (typedFilters.dateRange?.end) {
			parsed.createdAt = { ...parsed.createdAt, lte: typedFilters.dateRange.end };
		}

		return parsed;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * Convierte un TagBase en un TagComplete deserializando campos JSON si existieran
 * @param tag Etiqueta base desde Prisma
 * @returns Etiqueta con campos JSON parseados
 */
export function toTagComplete(tag: TagBase): TagComplete {
	try {
		// Actualmente Tag no tiene campos JSON, así que simplemente devolvemos el objeto
		// En un futuro, si se añaden campos JSON, aquí se parsearían
		return {
			...tag
		};
	} catch (error) {
		serializerLogger.error('❌ Error al deserializar Tag a TagComplete:', error);
		// En caso de error, devolvemos el objeto original
		return tag as TagComplete;
	}
}

/**
 * Convierte TagComplete a su formato para almacenar en base de datos
 * @param tag Etiqueta con campos parseados
 * @returns Etiqueta con campos serializados para almacenar
 */
export function fromTagComplete(tag: TagComplete): TagBase {
	try {
		// Actualmente Tag no tiene campos JSON, así que simplemente devolvemos el objeto
		// En un futuro, si se añaden campos JSON, aquí se serializarían
		return {
			...tag
		};
	} catch (error) {
		serializerLogger.error('❌ Error al serializar TagComplete a TagBase:', error);
		// En caso de error, devolvemos el objeto original
		return tag as TagBase;
	}
}

/**
 * Convierte una etiqueta básica en una etiqueta extendida con propiedades UI
 * @param tag Etiqueta básica o completa
 * @returns Etiqueta con información adicional
 */
export function createExtendedTag(tag: TagBase | TagComplete): TagExtended {
	// Asegurar que tenemos una versión completa
	const completeTag = 'id' in tag ? toTagComplete(tag) : tag;

	const extended: TagExtended = {
		...completeTag,
		isSelected: false,
		isExpanded: false,
		isEditing: false,
		isHighlighted: false,
	};

	return extended;
}

/**
 * Convierte múltiples etiquetas básicas en etiquetas extendidas
 * @param tags Lista de etiquetas básicas
 * @returns Lista de etiquetas extendidas
 */
export function extendTags(tags: (TagBase | TagComplete)[]): TagExtended[] {
	return tags.map(createExtendedTag);
}

/**
 * Convierte una etiqueta en su versión con estadísticas
 * @param tag Etiqueta base con datos de conteo
 * @returns Etiqueta con estadísticas
 */
export function tagToTagWithStats(tag: TagBase & { _count?: { images?: number } }): TagWithStats {
	// Asegurar que tenemos una versión completa
	const completeTag = 'id' in tag ? toTagComplete(tag) : tag;
	const imageCount = tag._count?.images || 0;

	return {
		...completeTag,
		count: imageCount,
		size: tag.totalSize ? formatSize(tag.totalSize) : "0 B",
	};
}

/**
 * Formatea un tamaño en bytes a una representación legible
 * @param bytes Tamaño en bytes
 * @returns Tamaño formateado (ej: "1.23 MB")
 */
export function formatSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Normaliza una categoría de etiqueta
 * @param category Categoría a normalizar (o undefined)
 * @returns Categoría normalizada
 */
export function normalizeTagCategory(category?: string | null): string {
	if (!category) return 'general';

	// Intentar mapear a una categoría existente del enum
	const lowerCategory = category.toLowerCase();
	for (const [key, value] of Object.entries(TagCategory)) {
		if (value.toLowerCase() === lowerCategory) {
			return value;
		}
	}

	// Si no coincide con ninguna del enum, devolver la categoría original o 'custom'
	return category.length > 0 ? category.toLowerCase() : 'custom';
}

/**
 * Genera un color por defecto basado en el nombre de la etiqueta
 * @param name Nombre de la etiqueta
 * @returns Color en formato hexadecimal
 */
export function generateTagColor(name: string): string {
	const colors = [
		'#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
		'#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#14b8a6',
		'#f97316', '#d946ef', '#6b7280' // Añadido gris
	];
	const hashValue = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
	return colors[hashValue % colors.length];
}

/**
 * Genera un emoji basado en el nombre o categoría de la etiqueta
 * @param name Nombre de la etiqueta
 * @param category Categoría de la etiqueta
 * @returns Emoji representativo
 */
export function generateTagEmoji(name: string, category?: string): string {
	const normalizedName = name.toLowerCase();
	const normalizedCategory = category?.toLowerCase() || '';

	if (normalizedCategory === 'person') return '👤';
	if (normalizedCategory === 'place') return '📍';
	if (normalizedCategory === 'event') return '🎉';
	if (normalizedCategory === 'organization') return '🏢';
	if (normalizedCategory === 'concept') return '💡';
	if (normalizedCategory === 'project') return '🏗️';

	// Por defecto
	return DEFAULT_TAG_EMOJI;
}

/**
 * Normaliza una rareza de etiqueta
 * @param rarity Rareza a normalizar (o undefined)
 * @returns Rareza normalizada
 */
export function normalizeTagRarity(rarity?: string | null): string {
	if (!rarity) return 'common';

	// Normalizar a lowercase para comparaciones
	const lowerRarity = rarity.toLowerCase();

	// Mapeo de posibles valores a los estándar
	const rarityMap: Record<string, string> = {
		'common': 'common',
		'uncommon': 'uncommon',
		'rare': 'rare',
		'epic': 'epic',
		'legendary': 'legendary',
		'mythic': 'mythic',
		'unique': 'unique'
	};

	// Verificar si coincide con alguna rareza estándar
	if (rarityMap[lowerRarity]) {
		return rarityMap[lowerRarity];
	}

	// Si no coincide, intentar coincidir parcialmente
	for (const [key, value] of Object.entries(rarityMap)) {
		if (lowerRarity.includes(key)) {
			return value;
		}
	}

	// Si no hay coincidencia, devolver 'common'
	return 'common';
}
