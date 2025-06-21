/**
 * @file Serializadores para Group
 * @module transformers/group/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    GroupBase,
    GroupComplete,
    GroupCreateInput,
    GroupTransformerOptions,
    GroupUpdateInput,
    GroupWithStats,
} from '@/types/entities/group';
import { GroupSchema } from '@/types/entities/group';
import type { Prisma, Group as PrismaGroup } from '@prisma/client';

const logger = serverLogger.withContext('GroupSerializers');

// Constantes por defecto
const DEFAULT_GROUP_EMOJI = '📁';
const DEFAULT_GROUP_COLOR = '#3b82f6';

// Funciones auxiliares simplificadas
function serializeJsonField<T>(field: T | null | undefined, defaultValue = '{}'): string {
	if (!field) return defaultValue;
	try {
		return JSON.stringify(field);
	} catch (error) {
		logger.error('Error serializando campo:', { error, field });
		return defaultValue;
	}
}

function deserializeJsonField<T>(field: string | null | undefined, defaultValue: T): T {
	if (!field || field === '[]' || field === '{}') return defaultValue;
	try {
		return JSON.parse(field) as T;
	} catch (error) {
		logger.error('Error deserializando campo:', { error, field });
		return defaultValue;
	}
}

function validateRequiredFields(data: Record<string, unknown>, requiredFields: string[]): void {
	for (const field of requiredFields) {
		if (data[field] === undefined || data[field] === null) {
			throw new Error(`Campo requerido ${field} falta o es nulo`);
		}
	}
}

function validateFieldType(value: unknown, type: string, fieldName: string): void {
	if (type === 'string' && typeof value !== 'string') {
		throw new Error(`El campo ${fieldName} debe ser de tipo string`);
	}
}

function handleTransformerError(error: unknown): Error {
	if (error instanceof Error) {
		return error;
	}
	return new Error('Error desconocido en el transformer');
}

/**
 * 🏷️ Serializa tags de grupo a formato JSON string
 * @param tags Array de tags o string JSON
 * @returns String JSON serializado
 */
export function serializeGroupTags(tags: string[] | string): string {
	try {
		if (typeof tags === 'string') {
			// Ya está serializado, validar que sea JSON válido
			JSON.parse(tags);
			return tags;
		}

		if (Array.isArray(tags)) {
			return JSON.stringify(tags);
		}

		return '[]'; // Array vacío por defecto
	} catch (error) {
		logger.error('Error serializando tags de grupo:', { error, tags });
		return '[]';
	}
}

/**
 * 🏷️ Deserializa tags de grupo desde formato JSON string
 * @param tags String JSON o array ya deserializado
 * @returns Array de strings
 */
export function deserializeGroupTags(tags: string | string[]): string[] {
	try {
		if (Array.isArray(tags)) {
			return tags;
		}

		if (typeof tags === 'string') {
			if (!tags || tags === '[]') return [];
			return JSON.parse(tags) as string[];
		}

		return [];
	} catch (error) {
		logger.error('Error deserializando tags de grupo:', { error, tags });
		return [];
	}
}

/**
 * 🔄 Serializa un Group para crear en Prisma
 */
export function toPrismaGroupCreate(data: GroupCreateInput): Prisma.GroupCreateInput {
	try {
		// Validar campos requeridos para creación
		validateRequiredFields(data as Record<string, unknown>, ['name']);

		// Validar tipos de datos
		validateFieldType(data.name, 'string', 'name');

		// Serializar campos JSON
		const filters = serializeJsonField(data.filters, '[]');

		// Definir el resultado con los valores correctos
		const result: Prisma.GroupCreateInput = {
			name: data.name,
			emoji: data.emoji || DEFAULT_GROUP_EMOJI,
			color: data.color || DEFAULT_GROUP_COLOR,
			description: data.description ?? null,
			shortcut: data.shortcut ?? null,
			category: data.category ?? null,
			sortBy: data.sortBy || 'name',
			filters,
			featuredImage: data.featuredImage ?? null,
			isFavorite: data.isFavorite ?? false,
		};

		return result;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Serializa un Group para actualizar en Prisma
 */
export function toPrismaGroupUpdate(data: GroupUpdateInput): Prisma.GroupUpdateInput {
	try {
		// Serializar campos JSON
		const filters = data.filters ? serializeJsonField(data.filters) : undefined;

		// Definir el resultado con los valores correctos
		const result: Prisma.GroupUpdateInput = {
			name: data.name,
			emoji: data.emoji,
			color: data.color,
			description: data.description,
			shortcut: data.shortcut,
			category: data.category,
			sortBy: data.sortBy,
			filters,
			featuredImage: data.featuredImage,
			isFavorite: data.isFavorite,
		};

		return result;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Serializa un Group (crear o actualizar)
 */
export function toPrismaGroup(
	data: GroupCreateInput | GroupUpdateInput
): Prisma.GroupCreateInput | Prisma.GroupUpdateInput {
	if ('id' in data) {
		return toPrismaGroupUpdate(data as GroupUpdateInput);
	}
	return toPrismaGroupCreate(data as GroupCreateInput);
}

/**
 * Interfaz que representa el payload de Prisma para un grupo, incluyendo las relaciones contadas.
 */
export type PrismaGroupWithCounts = PrismaGroup & {
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tags?: number;
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		prompts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
	};
};

/**
 *  transforma un objeto de grupo de Prisma a un objeto GroupWithStats,
 * calculando todas las estadísticas necesarias.
 *
 * @param prismaGroup - El objeto de grupo obtenido de Prisma, con los conteos.
 * @returns Un objeto GroupWithStats completo y seguro.
 */
export function fromPrismaGroup(prismaGroup: PrismaGroupWithCounts): GroupWithStats {
	const { _count, ...baseGroup } = prismaGroup;
	const counts = _count || {};

	const stats = {
		totalImages: counts.images || 0,
		totalVideos: counts.videos || 0,
		totalAlbums: counts.albums || 0,
		totalCollections: counts.collections || 0,
		totalTags: counts.tags || 0,
		totalCharacters: counts.characters || 0,
		totalPlaces: counts.places || 0,
		totalWorldItems: counts.worldItems || 0,
		totalConcepts: counts.concepts || 0,
		totalPrompts: counts.prompts || 0,
		totalNotes: counts.notes || 0,
		totalWildcards: counts.wildcards || 0,
		totalProperties: counts.properties || 0,
		lastUpdated: prismaGroup.updatedAt,
		totalItems: 0,
	};

	stats.totalItems =
		stats.totalImages +
		stats.totalVideos +
		stats.totalAlbums +
		stats.totalCollections +
		stats.totalTags +
		stats.totalCharacters +
		stats.totalPlaces +
		stats.totalWorldItems +
		stats.totalConcepts +
		stats.totalPrompts +
		stats.totalNotes +
		stats.totalWildcards +
		stats.totalProperties;

	return {
		...(baseGroup as GroupBase),
		_count: {
			images: stats.totalImages,
			videos: stats.totalVideos,
			albums: stats.totalAlbums,
			collections: stats.totalCollections,
			tags: stats.totalTags,
			characters: stats.totalCharacters,
			places: stats.totalPlaces,
			worldItems: stats.totalWorldItems,
			concepts: stats.totalConcepts,
			prompts: stats.totalPrompts,
			notes: stats.totalNotes,
			wildcards: stats.totalWildcards,
			properties: stats.totalProperties,
		},
		stats,
	};
}

/**
 * 🔍 Valida un Group
 */
export function validateGroup(data: unknown): GroupComplete {
	try {
		const validated = GroupSchema.parse(data);
		return validated as GroupComplete;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Extiende un Group con datos adicionales
 */
export function extendGroup(group: GroupBase, options: GroupTransformerOptions = {}): GroupComplete {
	try {
		const extended = { ...group } as GroupComplete;

		// Deserializar campos JSON si son strings
		if (typeof extended.filters === 'string') {
			extended.filters = deserializeJsonField(extended.filters, []);
		}

		// Asegurar que las propiedades de UI tengan valores por defecto
		if (!extended.emoji) extended.emoji = DEFAULT_GROUP_EMOJI;
		if (!extended.color) extended.color = DEFAULT_GROUP_COLOR;
		if (!extended.category) extended.category = 'general';
		if (!extended.sortBy) extended.sortBy = 'name';

		// Inicializar relaciones vacías si se incluyen relaciones
		if (options.includeRelations) {
			extended.images = [];
			extended.videos = [];
			extended.albums = [];
			extended.collections = [];
			extended.tags = [];
			extended.characters = [];
			extended.places = [];
			extended.worldItems = [];
			extended.concepts = [];
			extended.prompts = [];
			extended.notes = [];
			extended.wildcards = [];
			extended.properties = [];
		}

		// Inicializar contadores si se incluyen conteos
		if (options.includeCount) {
			extended._count = {
				images: 0,
				videos: 0,
				albums: 0,
				collections: 0,
				tags: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
			};
		}

		return extended;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔍 Parsea filtros de Group
 */
export function parseGroupFilterObject(filters: unknown): Prisma.GroupWhereInput {
	try {
		if (!filters || typeof filters !== 'object') {
			return {};
		}

		const parsed: Prisma.GroupWhereInput = {};
		const typedFilters = filters as Record<string, unknown>;

		// Procesar filtros específicos de Group
		if (typedFilters.search) {
			parsed.OR = [
				{ name: { contains: String(typedFilters.search), mode: 'insensitive' } },
				{ description: { contains: String(typedFilters.search), mode: 'insensitive' } },
			];
		}

		// Filtros de igualdad exacta
		if (typedFilters.category) {
			parsed.category = String(typedFilters.category);
		}

		// Filtros booleanos
		if (typedFilters.isFavorite !== undefined) {
			parsed.isFavorite = Boolean(typedFilters.isFavorite);
		}

		return parsed;
	} catch (error) {
		logger.error('Error parseando filtros de Group:', error);
		return {};
	}
}

/**
 * 🎨 Genera un emoji para un grupo basado en su nombre y categoría
 */
export function generateGroupEmoji(name: string, category?: string): string {
	try {
		// Emojis por categoría
		const categoryEmojis: Record<string, string[]> = {
			general: ['📁', '📂', '📋', '📑', '📌', '📎', '🗂️', '🗄️', '📚'],
			personal: ['👤', '👨‍💼', '👩‍💼', '🏠', '👪', '👫', '🧑‍🤝‍🧑'],
			work: ['💼', '👔', '🏢', '💻', '📊', '📈', '📉', '📝'],
			project: ['🚀', '⚙️', '🔧', '🔨', '🛠️', '📐', '📏', '✏️'],
			media: ['🎬', '🎥', '📷', '📸', '🎵', '🎹', '🎧', '🎨'],
			travel: ['✈️', '🚆', '🚗', '🏖️', '🏔️', '🏙️', '🗺️', '🧳'],
			food: ['🍽️', '🍕', '🍣', '🍰', '🍷', '🍹', '🥂', '🍳'],
			education: ['📚', '🎓', '✏️', '📝', '📖', '🧠', '🔬', '🧪'],
			health: ['💪', '🏋️‍♀️', '🧘‍♂️', '🏃‍♀️', '🥗', '🍎', '💊', '🩺'],
			finance: ['💰', '💵', '💳', '📊', '📈', '🏦', '💹', '💲'],
		};

		// Determinar la categoría a usar
		const resolvedCategory = category?.toLowerCase() || 'general';
		const emojis = categoryEmojis[resolvedCategory] || categoryEmojis.general;

		// Generar un índice basado en el nombre
		let hash = 0;
		for (const char of name) {
			hash = (hash << 5) - hash + char.charCodeAt(0);
			hash |= 0; // Convertir a entero de 32 bits
		}
		const index = Math.abs(hash) % emojis.length;

		return emojis[index];
	} catch (error) {
		logger.error('Error generando emoji para Group:', error);
		return DEFAULT_GROUP_EMOJI;
	}
}

/**
 * 🎨 Genera un color para un grupo basado en su nombre
 */
export function generateGroupColor(name: string): string {
	try {
		// Paleta de colores para grupos
		const colors = [
			'#3b82f6', // Azul
			'#ef4444', // Rojo
			'#10b981', // Verde
			'#f59e0b', // Ámbar
			'#8b5cf6', // Violeta
			'#ec4899', // Rosa
			'#06b6d4', // Cyan
			'#f97316', // Naranja
			'#14b8a6', // Teal
			'#6366f1', // Índigo
			'#d946ef', // Fucsia
			'#84cc16', // Lima
		];

		// Generar un índice basado en el nombre
		let hash = 0;
		for (const char of name) {
			hash = (hash << 5) - hash + char.charCodeAt(0);
			hash |= 0; // Convertir a entero de 32 bits
		}
		const index = Math.abs(hash) % colors.length;

		return colors[index];
	} catch (error) {
		logger.error('Error generando color para Group:', error);
		return DEFAULT_GROUP_COLOR;
	}
}

export { extendGroup as toExtendedGroup };

