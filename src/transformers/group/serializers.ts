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
	type GroupUpdateInput,
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
import type { Prisma } from '@prisma/client';

const logger = serverLogger.withContext('GroupSerializer');

// Constantes para valores por defecto
export const DEFAULT_GROUP_EMOJI = '📂';
export const DEFAULT_GROUP_COLOR = '#3b82f6';

/**
 * 🔄 Serializa un Group para Prisma
 */
export function toPrismaGroup(
	data: GroupCreateInput | GroupUpdateInput
): Prisma.GroupCreateInput | Prisma.GroupUpdateInput {
	try {
		// Validar campos requeridos para creación
		if (!('id' in data)) {
			validateRequiredFields(data, ['name']);
		}

		// Validar tipos de datos
		validateFieldType(data.name, 'string', 'name');
		validateFieldType(data.emoji, 'string', 'emoji');
		validateFieldType(data.color, 'string', 'color');

		// Serializar campos JSON
		const filters = serializeJsonField(data.filters, '[]');

		// Preparar resultado con copia para evitar mutar el original
		const { isFavorite, ...otherProps } = data;

		// Definir el resultado con los valores correctos
		const result: Record<string, any> = {
			...otherProps,
			filters,
		};

		// Convertir isFavorite a favorite si está presente
		if (isFavorite !== undefined) {
			result.favorite = isFavorite;
		}

		// Preparar relaciones para Prisma
		const relations = preparePrismaRelations('Group', data);
		Object.assign(result, relations);

		return result as Prisma.GroupCreateInput | Prisma.GroupUpdateInput;
	} catch (error) {
		throw handleTransformerError(error);
	}
}

/**
 * 🔄 Deserializa un Group desde Prisma
 */
export function fromPrismaGroup(
	prismaGroup: Prisma.GroupGetPayload<{
		include: {
			images: true;
			videos: true;
			albums: true;
			collections: true;
			tags: true;
			characters: true;
			places: true;
			worldItems: true;
			concepts: true;
			prompts: true;
			notes: true;
			wildcards: true;
			properties: true;
			_count: true;
		};
	}>
): GroupComplete {
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
			isFavorite: prismaGroup.favorite || false,
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
			parsed.favorite = Boolean(typedFilters.isFavorite);
		} else if (typedFilters.favorite !== undefined) {
			parsed.favorite = Boolean(typedFilters.favorite);
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
		// Si hay categoría, intentar basarse en ella primero
		if (category) {
			const lowerCategory = category.toLowerCase();

			// Mapeo de categorías comunes a emojis
			const categoryEmojis: Record<string, string> = {
				general: '📂',
				arte: '🎨',
				musica: '🎵',
				viajes: '✈️',
				comida: '🍽️',
				personas: '👥',
				eventos: '🎉',
				naturaleza: '🌿',
				tecnologia: '💻',
				deportes: '⚽',
			};

			if (categoryEmojis[lowerCategory]) {
				return categoryEmojis[lowerCategory];
			}
		}

		// Si no hay categoría o no se encontró un emoji para ella,
		// usar el nombre para generar un emoji simple
		const lowerName = name.toLowerCase();

		// Algunos emojis basados en palabras clave comunes
		if (lowerName.includes('foto') || lowerName.includes('imag')) return '📸';
		if (lowerName.includes('video')) return '🎬';
		if (lowerName.includes('fav')) return '⭐';
		if (lowerName.includes('trabajo') || lowerName.includes('job')) return '💼';
		if (lowerName.includes('viaje')) return '✈️';
		if (lowerName.includes('familia')) return '👨‍👩‍👧‍👦';
		if (lowerName.includes('mascota') || lowerName.includes('animal')) return '🐾';

		// Emoji por defecto si no coincide con ninguna palabra clave
		return DEFAULT_GROUP_EMOJI;
	} catch (error) {
		logger.error('Error generando emoji para grupo:', error);
		return DEFAULT_GROUP_EMOJI;
	}
}

/**
 * 🎨 Genera un color para un grupo basado en su nombre
 */
export function generateGroupColor(name: string): string {
	try {
		// Lista de colores predefinidos para grupos
		const colors = [
			'#3b82f6', // azul
			'#10b981', // verde
			'#f59e0b', // amarillo
			'#ef4444', // rojo
			'#8b5cf6', // púrpura
			'#ec4899', // rosa
			'#06b6d4', // cian
			'#f97316', // naranja
			'#6366f1', // indigo
			'#14b8a6', // verde azulado
		];

		// Usar una función hash simple basada en el nombre
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}

		// Obtener un índice dentro del rango de colores
		const index = Math.abs(hash) % colors.length;

		return colors[index];
	} catch (error) {
		logger.error('Error generando color para grupo:', error);
		return DEFAULT_GROUP_COLOR;
	}
}

/**
 * 🔄 Transforma un grupo de la base de datos a una versión extendida
 */
export function toExtendedGroup(group: any): GroupComplete {
	try {
		if (!group) {
			throw new Error('Se requiere un objeto grupo válido');
		}

		// Si el grupo ya tiene la propiedad isFavorite, convertirla a favorite
		let isFavorite = false;
		if (group.favorite !== undefined) {
			isFavorite = Boolean(group.favorite);
		} else if (group.isFavorite !== undefined) {
			isFavorite = Boolean(group.isFavorite);
		}

		// Deserializar campos JSON
		const filters = deserializeJsonField(group.filters, []);

		// Construir objeto base con formato correcto
		const baseGroup: GroupBase = {
			id: group.id,
			name: group.name,
			emoji: group.emoji || DEFAULT_GROUP_EMOJI,
			color: group.color || DEFAULT_GROUP_COLOR,
			description: group.description || '',
			shortcut: group.shortcut || null,
			category: group.category || 'general',
			sortBy: group.sortBy || 'name',
			filters,
			featuredImage: group.featuredImage || null,
			isFavorite,
			createdAt: group.createdAt,
			updatedAt: group.updatedAt,
		};

		// Si tiene contadores, agregarlos
		const counts = group._count || {};

		// Construir objeto completo con relaciones
		return {
			...baseGroup,
			images: Array.isArray(group.images) ? group.images.map((img: any) => ({ id: img.id })) : [],
			videos: Array.isArray(group.videos) ? group.videos.map((vid: any) => ({ id: vid.id })) : [],
			albums: Array.isArray(group.albums) ? group.albums.map((alb: any) => ({ id: alb.id })) : [],
			collections: Array.isArray(group.collections) ? group.collections.map((col: any) => ({ id: col.id })) : [],
			tags: Array.isArray(group.tags) ? group.tags.map((tag: any) => ({ id: tag.id })) : [],
			characters: Array.isArray(group.characters) ? group.characters.map((char: any) => ({ id: char.id })) : [],
			places: Array.isArray(group.places) ? group.places.map((place: any) => ({ id: place.id })) : [],
			worldItems: Array.isArray(group.worldItems) ? group.worldItems.map((item: any) => ({ id: item.id })) : [],
			concepts: Array.isArray(group.concepts) ? group.concepts.map((con: any) => ({ id: con.id })) : [],
			prompts: Array.isArray(group.prompts) ? group.prompts.map((prompt: any) => ({ id: prompt.id })) : [],
			notes: Array.isArray(group.notes) ? group.notes.map((note: any) => ({ id: note.id })) : [],
			wildcards: Array.isArray(group.wildcards) ? group.wildcards.map((wild: any) => ({ id: wild.id })) : [],
			properties: Array.isArray(group.properties) ? group.properties.map((prop: any) => ({ id: prop.id })) : [],
			_count: {
				images: counts.images || 0,
				videos: counts.videos || 0,
				albums: counts.albums || 0,
				collections: counts.collections || 0,
				tags: counts.tags || 0,
				characters: counts.characters || 0,
				places: counts.places || 0,
				worldItems: counts.worldItems || 0,
				concepts: counts.concepts || 0,
				prompts: counts.prompts || 0,
				notes: counts.notes || 0,
				wildcards: counts.wildcards || 0,
				properties: counts.properties || 0,
			},
		};
	} catch (error) {
		logger.error('Error transformando grupo extendido:', error);
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
