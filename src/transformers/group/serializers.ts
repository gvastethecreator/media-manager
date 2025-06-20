/**
 * @file Funciones para serializar y deserializar datos de grupos
 * @module transformers/group/serializers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import {
    type GroupBase,
    type GroupComplete,
    type GroupCreateInput,
    GroupSchema,
    type GroupTransformerOptions,
    type GroupUpdateInput
} from '@/types/entities/group/types';
import {
    deserializeJsonField,
    serializeJsonField,
    validateFieldType,
    validateRequiredFields,
} from '@/utils/transformers/common';
import { DEFAULT_UI_VALUES } from '@/utils/transformers/constants';
import { handleTransformerError } from '@/utils/transformers/errors';
import { getRelationCounts, preparePrismaRelations, validateEntityRelations } from '@/utils/transformers/relations';
import { validateBaseEntity, validateMetadataFields, validateUIFields } from '@/utils/transformers/validation';

const logger = serverLogger.withContext('GroupSerializer');

// Constantes para valores por defecto
export const DEFAULT_GROUP_EMOJI = '📂';
export const DEFAULT_GROUP_COLOR = '#3b82f6';

/**
 * Interfaces para los tipos de Prisma que necesitamos
 */
export interface PrismaGroupCreateInput {
	id?: string;
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	sortBy?: string;
	filters?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	createdAt?: Date;
	updatedAt?: Date;
	images?: Record<string, any>;
	videos?: Record<string, any>;
	albums?: Record<string, any>;
	collections?: Record<string, any>;
	tags?: Record<string, any>;
	characters?: Record<string, any>;
	places?: Record<string, any>;
	worldItems?: Record<string, any>;
	concepts?: Record<string, any>;
	prompts?: Record<string, any>;
	notes?: Record<string, any>;
	wildcards?: Record<string, any>;
	properties?: Record<string, any>;
}

export interface PrismaGroupUpdateInput {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	shortcut?: string | null;
	category?: string | null;
	sortBy?: string;
	filters?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	updatedAt?: Date;
	images?: Record<string, any>;
	videos?: Record<string, any>;
	albums?: Record<string, any>;
	collections?: Record<string, any>;
	tags?: Record<string, any>;
	characters?: Record<string, any>;
	places?: Record<string, any>;
	worldItems?: Record<string, any>;
	concepts?: Record<string, any>;
	prompts?: Record<string, any>;
	notes?: Record<string, any>;
	wildcards?: Record<string, any>;
	properties?: Record<string, any>;
}

export interface PrismaGroupGetPayload {
	id: string;
	name: string;
	emoji: string;
	color: string;
	description: string | null;
	shortcut: string | null;
	category: string | null;
	sortBy: string;
	filters: string;
	featuredImage: string | null;
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
	images?: Array<{ id: string }>;
	videos?: Array<{ id: string }>;
	albums?: Array<{ id: string }>;
	collections?: Array<{ id: string }>;
	tags?: Array<{ id: string }>;
	characters?: Array<{ id: string }>;
	places?: Array<{ id: string }>;
	worldItems?: Array<{ id: string }>;
	concepts?: Array<{ id: string }>;
	prompts?: Array<{ id: string }>;
	notes?: Array<{ id: string }>;
	wildcards?: Array<{ id: string }>;
	properties?: Array<{ id: string }>;
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
}

export interface PrismaGroupWhereInput {
	AND?: PrismaGroupWhereInput[];
	OR?: PrismaGroupWhereInput[];
	NOT?: PrismaGroupWhereInput[];
	name?: { contains: string; mode: string };
	description?: { contains: string; mode: string };
	category?: string;
	isFavorite?: boolean;
}

/**
 * 🔄 Serializa un Group para crear en Prisma
 */
export function toPrismaGroupCreate(data: GroupCreateInput): PrismaGroupCreateInput {
	try {
		// Validar campos requeridos para creación
		validateRequiredFields(data, ['name']);

		// Validar tipos de datos
		validateFieldType(data.name, 'string', 'name');

		// Serializar campos JSON
		const filters = serializeJsonField(data.filters, '[]');

		// Definir el resultado con los valores correctos
		const result: PrismaGroupCreateInput = {
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

		// Preparar relaciones para Prisma
		const relations = preparePrismaRelations('Group', data);
		Object.assign(result, relations);

		return result;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Serializa un Group para actualizar en Prisma
 */
export function toPrismaGroupUpdate(data: GroupUpdateInput): PrismaGroupUpdateInput {
	try {
		// Serializar campos JSON
		const filters = data.filters ? serializeJsonField(data.filters, '[]') : undefined;

		// Definir el resultado con los valores correctos
		const result: PrismaGroupUpdateInput = {
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

		// Preparar relaciones para Prisma
		const relations = preparePrismaRelations('Group', data);
		Object.assign(result, relations);

		return result;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Serializa un Group para Prisma (legacy)
 * @deprecated Usar toPrismaGroupCreate o toPrismaGroupUpdate
 */
export function toPrismaGroup(
	data: GroupCreateInput | GroupUpdateInput
): PrismaGroupCreateInput | PrismaGroupUpdateInput {
	if ('id' in data && data.id) {
		return toPrismaGroupUpdate(data as GroupUpdateInput);
	}
		return toPrismaGroupCreate(data as GroupCreateInput);
}

/**
 * 🔄 Deserializa un Group desde Prisma
 */
export function fromPrismaGroup(prismaGroup: PrismaGroupGetPayload): GroupComplete {
	try {
		// Deserializar campos JSON
		const filters = deserializeJsonField(prismaGroup.filters, []);

		// Obtener conteos de relaciones
		const counts = getRelationCounts('Group', prismaGroup);

		// Construir objeto base
		const baseGroup: GroupBase = {
			id: prismaGroup.id,
			name: prismaGroup.name,
			emoji: prismaGroup.emoji || DEFAULT_UI_VALUES.emoji,
			color: prismaGroup.color || DEFAULT_UI_VALUES.color,
			description: prismaGroup.description,
			shortcut: prismaGroup.shortcut,
			category: prismaGroup.category || 'general',
			sortBy: prismaGroup.sortBy || 'name',
			filters,
			featuredImage: prismaGroup.featuredImage,
			isFavorite: prismaGroup.isFavorite || false,
			createdAt: prismaGroup.createdAt,
			updatedAt: prismaGroup.updatedAt,
		};

		// Validar objeto base
		validateBaseEntity(baseGroup);
		validateUIFields(baseGroup);
		validateMetadataFields(baseGroup);

		// Construir objeto completo con relaciones
		return {
			...baseGroup,
			images: prismaGroup.images?.map((img) => ({ id: img.id })) || [],
			videos: prismaGroup.videos?.map((vid) => ({ id: vid.id })) || [],
			albums: prismaGroup.albums?.map((alb) => ({ id: alb.id })) || [],
			collections: prismaGroup.collections?.map((col) => ({ id: col.id })) || [],
			tags: prismaGroup.tags?.map((tag) => ({ id: tag.id })) || [],
			characters: prismaGroup.characters?.map((char) => ({ id: char.id })) || [],
			places: prismaGroup.places?.map((place) => ({ id: place.id })) || [],
			worldItems: prismaGroup.worldItems?.map((item) => ({ id: item.id })) || [],
			concepts: prismaGroup.concepts?.map((con) => ({ id: con.id })) || [],
			prompts: prismaGroup.prompts?.map((prompt) => ({ id: prompt.id })) || [],
			notes: prismaGroup.notes?.map((note) => ({ id: note.id })) || [],
			wildcards: prismaGroup.wildcards?.map((wild) => ({ id: wild.id })) || [],
			properties: prismaGroup.properties?.map((prop) => ({ id: prop.id })) || [],
			_count: counts,
		};
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔍 Valida un Group
 */
export function validateGroup(data: unknown): GroupComplete {
	try {
		const validated = GroupSchema.parse(data);
		validateEntityRelations('Group', validated);
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
export function parseGroupFilterObject(filters: unknown): PrismaGroupWhereInput {
	try {
		if (!filters || typeof filters !== 'object') {
			return {};
		}

		const parsed: PrismaGroupWhereInput = {};
		const typedFilters = filters as Record<string, unknown>;

		// Procesar filtros específicos de Group
		if (typedFilters.search) {
			parsed.OR = [
				{ name: { contains: String(typedFilters.search) } },
				{ description: { contains: String(typedFilters.search) } },
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

/**
 * 🔄 Transforma un objeto Group a formato extendido
 */
export function toExtendedGroup(group: any): GroupComplete {
	try {
		// Validar que sea un objeto
		if (!group || typeof group !== 'object') {
			throw new Error('Input inválido para toExtendedGroup');
		}

		// Convertir favorite a isFavorite si es necesario
		if ('favorite' in group && !('isFavorite' in group)) {
			group.isFavorite = group.favorite;
		}

		// Deserializar campos JSON si son strings
		if (typeof group.filters === 'string') {
			group.filters = deserializeJsonField(group.filters, []);
		}

		// Asegurar que las propiedades de UI tengan valores por defecto
		if (!group.emoji) group.emoji = DEFAULT_GROUP_EMOJI;
		if (!group.color) group.color = DEFAULT_GROUP_COLOR;
		if (!group.category) group.category = 'general';
		if (!group.sortBy) group.sortBy = 'name';

		// Inicializar relaciones vacías
		const extended = {
			...group,
			images: group.images || [],
			videos: group.videos || [],
			albums: group.albums || [],
			collections: group.collections || [],
			tags: group.tags || [],
			characters: group.characters || [],
			places: group.places || [],
			worldItems: group.worldItems || [],
			concepts: group.concepts || [],
			prompts: group.prompts || [],
			notes: group.notes || [],
			wildcards: group.wildcards || [],
			properties: group.properties || [],
			_count: group._count || {
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
			},
		};

		return extended;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

// Exportación para compatibilidad
export const GroupSerializer = {
	toPrismaGroup,
	fromPrismaGroup,
	validateGroup,
	extendGroup,
	parseGroupFilterObject,
	generateGroupEmoji,
	generateGroupColor,
	toExtendedGroup,
};

export default GroupSerializer;
