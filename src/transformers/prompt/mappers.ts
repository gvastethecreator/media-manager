/**
 * @file Funciones de mapeo para la entidad Prompt
 * @module transformers/prompt/mappers
 */

import { serverLogger } from '@/lib/logger/server-logger';
import type {
    CreatePromptData,
    PromptBase,
    PromptFilters,
    PromptSortCriteria,
    PromptWithRelations,
    UpdatePromptData,
} from '@/types/entities/prompt/types';
import { serializeParameters } from './serializers';

const logger = serverLogger.withContext('PromptMappers');

/**
 * Tipo para Prisma.PromptCreateInput
 */
export interface PrismaPromptCreateInput {
	name: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	purpose?: string;
	category?: string;
	parameters?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	groups?: {
		connect: Array<{ id: string }>;
	};
	properties?: {
		connect: Array<{ id: string }>;
	};
	wildcards?: {
		connect: Array<{ id: string }>;
	};
	tags?: {
		connect: Array<{ id: string }>;
	};
}

/**
 * Tipo para Prisma.PromptUpdateInput
 */
export interface PrismaPromptUpdateInput {
	name?: string;
	emoji?: string;
	color?: string;
	description?: string | null;
	content?: string;
	purpose?: string;
	category?: string;
	parameters?: string;
	featuredImage?: string | null;
	isFavorite?: boolean;
	groups?: {
		set: Array<{ id: string }>;
	};
	properties?: {
		set: Array<{ id: string }>;
	};
	wildcards?: {
		set: Array<{ id: string }>;
	};
	tags?: {
		set: Array<{ id: string }>;
	};
}

/**
 * Tipo para Prisma.PromptUpdateArgs
 */
export interface PrismaPromptUpdateArgs {
	where: { id: string };
	data: PrismaPromptUpdateInput;
}

/**
 * Tipo para Prisma.PromptWhereInput
 */
export interface PrismaPromptWhereInput {
	OR?: Array<{
		name?: { contains: string; };
		description?: { contains: string; };
		content?: { contains: string; };
	}>;
	category?: { in: string[] };
	purpose?: { in: string[] };
	isFavorite?: boolean;
	content?: { contains: string; };
}

/**
 * Tipo para Prisma.PromptOrderByWithRelationInput
 */
export interface PrismaPromptOrderByWithRelationInput {
	name?: 'asc' | 'desc';
	createdAt?: 'asc' | 'desc';
	updatedAt?: 'asc' | 'desc';
}

/**
 * Tipo que representa un Prompt como viene de Prisma con todas sus relaciones
 */
export interface PromptFromPrisma extends PromptBase {
	// Relaciones como vienen de Prisma
	images?: Array<{ id: string; name: string; path: string }>;
	videos?: Array<{ id: string; name: string; path: string }>;
	albums?: Array<{ id: string; name: string; emoji: string; color: string }>;
	collections?: Array<{ id: string; name: string; emoji: string; color: string }>;
	tags?: Array<{ id: string; name: string; color: string }>; // Cambio de tagEntities a tags
	characters?: Array<{ id: string; name: string; emoji: string; color: string }>;
	places?: Array<{ id: string; name: string; emoji: string; color: string }>;
	worldItems?: Array<{ id: string; name: string; emoji: string; color: string }>;
	concepts?: Array<{ id: string; name: string; emoji: string; color: string }>;
	notes?: Array<{ id: string; title: string; content: string }>;
	wildcards?: Array<{ id: string; name: string; emoji: string; color: string }>;
	properties?: Array<{ id: string; name: string; value: string }>;
	groups?: Array<{ id: string; name: string; emoji: string; color: string }>;

	// Conteos como vienen de Prisma
	_count?: {
		images?: number;
		videos?: number;
		albums?: number;
		collections?: number;
		tags?: number; // Cambio de tagEntities a tags
		characters?: number;
		places?: number;
		worldItems?: number;
		concepts?: number;
		notes?: number;
		wildcards?: number;
		properties?: number;
		groups?: number;
	};
}

/**
 * Tipo que representa un Prompt completo con todas sus relaciones mapeadas
 */
export interface PromptComplete extends PromptWithRelations {
	// Ya hereda todo de PromptWithRelations
}

/**
 * 🔄 Mapea datos de creación de Prompt a formato Prisma
 * @param data Datos de creación
 * @returns Objeto compatible con Prisma.PromptCreateInput
 */
export function mapCreatePromptDataToPrisma(data: CreatePromptData): PrismaPromptCreateInput {
	try {
		// Serializar arrays y objetos a JSON si es necesario
		const parameters = typeof data.parameters === 'string' ? data.parameters : serializeParameters(data.parameters);
		// const tags = typeof data.tags === 'string' ? data.tags : serializeTags(data.tags); // ❌ ELIMINADO - Usar solo relaciones

		// Crear objeto base
		const promptData: PrismaPromptCreateInput = {
			name: data.name,
			emoji: data.emoji || '💬',
			color: data.color || '#3b82f6',
			description: data.description || null,
			content: data.content || '',
			purpose: data.purpose || 'general',
			category: data.category || 'general',
			parameters,
			// tags, // ❌ ELIMINADO - Usar solo relaciones
			featuredImage: data.featuredImage || null,
			isFavorite: data.isFavorite || false,
		};

		// Agregar relaciones si existen
		if (data.groupIds && data.groupIds.length > 0) {
			promptData.groups = {
				connect: data.groupIds.map((id) => ({ id })),
			};
		}

		if (data.propertyIds && data.propertyIds.length > 0) {
			promptData.properties = {
				connect: data.propertyIds.map((id) => ({ id })),
			};
		}

		if (data.wildcardIds && data.wildcardIds.length > 0) {
			promptData.wildcards = {
				connect: data.wildcardIds.map((id) => ({ id })),
			};
		}

		if (data.tagIds && data.tagIds.length > 0) {
			promptData.tags = {
				connect: data.tagIds.map((id) => ({ id })),
			};
		}

		return promptData;
	} catch (error) {
		logger.error('Error mapeando datos de creación:', error);
		throw new Error(
			`Error al mapear datos de creación de prompt: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * 🔄 Mapea datos de actualización de Prompt a formato Prisma
 * @param id ID del prompt a actualizar
 * @param data Datos de actualización
 * @returns Objeto compatible con Prisma.PromptUpdateArgs
 */
export function mapUpdatePromptDataToPrisma(id: string, data: UpdatePromptData): PrismaPromptUpdateArgs {
	try {
		// Preparar datos base (solo incluir campos proporcionados)
		const updateData: PrismaPromptUpdateInput = {};

		// Asignar campos simples si están definidos
		if (data.name !== undefined) updateData.name = data.name;
		if (data.emoji !== undefined) updateData.emoji = data.emoji;
		if (data.color !== undefined) updateData.color = data.color;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.content !== undefined) updateData.content = data.content;
		if (data.purpose !== undefined) updateData.purpose = data.purpose;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;

		// Serializar campos complejos si están definidos
		if (data.parameters !== undefined) {
			updateData.parameters =
				typeof data.parameters === 'string' ? data.parameters : serializeParameters(data.parameters);
		}
		// if (data.tags !== undefined) { // ❌ ELIMINADO - Usar solo relaciones
		//	updateData.tags = typeof data.tags === 'string' ? data.tags : serializeTags(data.tags);
		// }

		// Actualizar relaciones si están definidas
		if (data.groupIds !== undefined) {
			updateData.groups = {
				set: data.groupIds.map((id) => ({ id })),
			};
		}

		if (data.propertyIds !== undefined) {
			updateData.properties = {
				set: data.propertyIds.map((id) => ({ id })),
			};
		}

		if (data.wildcardIds !== undefined) {
			updateData.wildcards = {
				set: data.wildcardIds.map((id) => ({ id })),
			};
		}

		if (data.tagIds !== undefined) {
			updateData.tags = {
				set: data.tagIds.map((id) => ({ id })),
			};
		}

		return {
			where: { id },
			data: updateData,
		};
	} catch (error) {
		logger.error('Error mapeando datos de actualización:', error);
		throw new Error(
			`Error al mapear datos de actualización de prompt: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * 🔄 Mapea filtros de Prompt a condiciones where de Prisma
 * @param filters Filtros para consultar prompts
 * @returns Objeto compatible con Prisma.PromptWhereInput
 */
export function mapPromptFiltersToPrisma(filters: PromptFilters = {}): PrismaPromptWhereInput {
	try {
		const where: PrismaPromptWhereInput = {};

		// Búsqueda por texto
		if (filters.searchQuery) {
			where.OR = [
				{ name: { contains: filters.searchQuery } },
				{ description: { contains: filters.searchQuery } },
				{ content: { contains: filters.searchQuery } },
			];
		}

		// Filtrar por categorías
		if (filters.categories && filters.categories.length > 0) {
			where.category = { in: filters.categories };
		}

		// Filtrar por propósitos
		if (filters.purposes && filters.purposes.length > 0) {
			where.purpose = { in: filters.purposes };
		}

		// Filtrar por favoritos
		if (filters.onlyFavorites) {
			where.isFavorite = true;
		}

		// Filtrar por contenido específico
		if (filters.contentContains) {
			where.content = { contains: filters.contentContains };
		}

		return where;
	} catch (error) {
		logger.error('Error mapeando filtros:', error);
		return {}; // Devolver objeto vacío en caso de error
	}
}

/**
 * 🔄 Mapea criterios de ordenación a formato Prisma
 * @param sortBy Criterio de ordenación
 * @returns Objeto compatible con Prisma.PromptOrderByWithRelationInput
 */
export function mapPromptSortCriteriaToPrisma(
	sortBy: PromptSortCriteria = PromptSortCriteria.UPDATED_DESC
): PrismaPromptOrderByWithRelationInput {
	// Extraer campo y dirección del criterio
	const [field, direction] = sortBy.split(':');
	const sortDirection = direction === 'asc' ? 'asc' : 'desc';

	// Mapear campo a propiedad de Prisma
	switch (field) {
		case 'name':
			return { name: sortDirection };
		case 'created':
			return { createdAt: sortDirection };
		case 'updated':
		default:
			return { updatedAt: sortDirection };
	}
}

/**
 * 🔄 Mapea un Prompt a formato simplificado para relaciones
 * @param prompt Prompt completo
 * @returns Prompt simplificado para relaciones
 */
export function mapPromptToRelated(
	prompt: PromptBase | PromptWithRelations
): Pick<PromptBase, 'id' | 'name' | 'emoji' | 'color'> {
	return {
		id: prompt.id,
		name: prompt.name,
		emoji: prompt.emoji,
		color: prompt.color,
	};
}

/**
 * 🔄 Mapea un array de Prompts a formato simplificado para relaciones
 * @param prompts Array de prompts
 * @returns Array de prompts simplificados
 */
export function mapPromptsToRelated(
	prompts: Array<PromptBase | PromptWithRelations>
): Array<Pick<PromptBase, 'id' | 'name' | 'emoji' | 'color'>> {
	return prompts.map(mapPromptToRelated);
}

/**
 * 🔄 Mapea `PromptFromPrisma` a `PromptComplete`
 */
export function mapPromptFromPrisma(prisma: PromptFromPrisma): PromptComplete {
	return {
		id: prisma.id,
		title: prisma.title,
		content: prisma.content,
		category: prisma.category,
		type: prisma.type,
		model: prisma.model,
		parameters: prisma.parameters,
		isTemplate: prisma.isTemplate,
		isFavorite: prisma.isFavorite,
		presetId: prisma.presetId,
		createdAt: prisma.createdAt,
		updatedAt: prisma.updatedAt,

		// Mapear relaciones
		images: prisma.images?.map(mapRelatedImage) || [],
		videos: prisma.videos?.map(mapRelatedVideo) || [],
		albums: prisma.albums?.map(mapRelatedAlbum) || [],
		collections: prisma.collections?.map(mapRelatedCollection) || [],
		tags: prisma.tags?.map(mapRelatedTag) || [],
		characters: prisma.characters?.map(mapRelatedCharacter) || [],
		places: prisma.places?.map(mapRelatedPlace) || [],
		worldItems: prisma.worldItems?.map(mapRelatedWorldItem) || [],
		concepts: prisma.concepts?.map(mapRelatedConcept) || [],
		notes: prisma.notes?.map(mapRelatedNote) || [],
		wildcards: prisma.wildcards?.map(mapRelatedWildcard) || [],
		properties: prisma.properties?.map(mapRelatedProperty) || [],
		groups: prisma.groups?.map(mapRelatedGroup) || [],

		// Mapear conteos
		_count: {
			images: prisma._count?.images || 0,
			videos: prisma._count?.videos || 0,
			albums: prisma._count?.albums || 0,
			collections: prisma._count?.collections || 0,
			tags: prisma._count?.tags || 0,
			characters: prisma._count?.characters || 0,
			places: prisma._count?.places || 0,
			worldItems: prisma._count?.worldItems || 0,
			concepts: prisma._count?.concepts || 0,
			notes: prisma._count?.notes || 0,
			wildcards: prisma._count?.wildcards || 0,
			properties: prisma._count?.properties || 0,
			groups: prisma._count?.groups || 0,
		},
	};
}

// Funciones auxiliares para mapear relaciones
function mapRelatedImage(image: { id: string; name: string; path: string }) {
	return { id: image.id, name: image.name, path: image.path };
}

function mapRelatedVideo(video: { id: string; name: string; path: string }) {
	return { id: video.id, name: video.name, path: video.path };
}

function mapRelatedAlbum(album: { id: string; name: string; emoji: string; color: string }) {
	return { id: album.id, name: album.name, emoji: album.emoji, color: album.color };
}

function mapRelatedCollection(collection: { id: string; name: string; emoji: string; color: string }) {
	return { id: collection.id, name: collection.name, emoji: collection.emoji, color: collection.color };
}

function mapRelatedTag(tag: { id: string; name: string; color: string }) {
	return { id: tag.id, name: tag.name, color: tag.color };
}

function mapRelatedCharacter(character: { id: string; name: string; emoji: string; color: string }) {
	return { id: character.id, name: character.name, emoji: character.emoji, color: character.color };
}

function mapRelatedPlace(place: { id: string; name: string; emoji: string; color: string }) {
	return { id: place.id, name: place.name, emoji: place.emoji, color: place.color };
}

function mapRelatedWorldItem(worldItem: { id: string; name: string; emoji: string; color: string }) {
	return { id: worldItem.id, name: worldItem.name, emoji: worldItem.emoji, color: worldItem.color };
}

function mapRelatedConcept(concept: { id: string; name: string; emoji: string; color: string }) {
	return { id: concept.id, name: concept.name, emoji: concept.emoji, color: concept.color };
}

function mapRelatedNote(note: { id: string; title: string; content: string }) {
	return { id: note.id, title: note.title, content: note.content };
}

function mapRelatedWildcard(wildcard: { id: string; name: string; emoji: string; color: string }) {
	return { id: wildcard.id, name: wildcard.name, emoji: wildcard.emoji, color: wildcard.color };
}

function mapRelatedProperty(property: { id: string; name: string; value: string }) {
	return { id: property.id, name: property.name, value: property.value };
}

function mapRelatedGroup(group: { id: string; name: string; emoji: string; color: string }) {
	return { id: group.id, name: group.name, emoji: group.emoji, color: group.color };
}
