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
    UpdatePromptData
} from '@/types/entities/prompt';
import { serializeParameters, serializeTags } from './serializers';

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
    tags?: string;
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
    tagEntities?: {
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
    tags?: string;
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
    tagEntities?: {
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
        name?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
        content?: { contains: string; mode: 'insensitive' };
    }>;
    category?: { in: string[] };
    purpose?: { in: string[] };
    isFavorite?: boolean;
    content?: { contains: string; mode: 'insensitive' };
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
 * 🔄 Mapea datos de creación de Prompt a formato Prisma
 * @param data Datos de creación
 * @returns Objeto compatible con Prisma.PromptCreateInput
 */
export function mapCreatePromptDataToPrisma(data: CreatePromptData): PrismaPromptCreateInput {
	try {
		// Serializar arrays y objetos a JSON si es necesario
		const parameters = typeof data.parameters === 'string' ? data.parameters : serializeParameters(data.parameters);
		const tags = typeof data.tags === 'string' ? data.tags : serializeTags(data.tags);

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
			tags,
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
			promptData.tagEntities = {
				connect: data.tagIds.map((id) => ({ id })),
			};
		}

		return promptData;
	} catch (error) {
		logger.error('Error mapeando datos de creación:', error);
		throw new Error(`Error al mapear datos de creación de prompt: ${error instanceof Error ? error.message : String(error)}`);
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
			updateData.parameters = typeof data.parameters === 'string' ? data.parameters : serializeParameters(data.parameters);
		}
		if (data.tags !== undefined) {
			updateData.tags = typeof data.tags === 'string' ? data.tags : serializeTags(data.tags);
		}

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
			updateData.tagEntities = {
				set: data.tagIds.map((id) => ({ id })),
			};
		}

		return {
			where: { id },
			data: updateData,
		};
	} catch (error) {
		logger.error('Error mapeando datos de actualización:', error);
		throw new Error(`Error al mapear datos de actualización de prompt: ${error instanceof Error ? error.message : String(error)}`);
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
				{ name: { contains: filters.searchQuery, mode: 'insensitive' } },
				{ description: { contains: filters.searchQuery, mode: 'insensitive' } },
				{ content: { contains: filters.searchQuery, mode: 'insensitive' } },
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
			where.content = { contains: filters.contentContains, mode: 'insensitive' };
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
export function mapPromptSortCriteriaToPrisma(sortBy: PromptSortCriteria = PromptSortCriteria.UPDATED_DESC): PrismaPromptOrderByWithRelationInput {
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
export function mapPromptToRelated(prompt: PromptBase | PromptWithRelations): Pick<PromptBase, 'id' | 'name' | 'emoji' | 'color'> {
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
export function mapPromptsToRelated(prompts: Array<PromptBase | PromptWithRelations>): Array<Pick<PromptBase, 'id' | 'name' | 'emoji' | 'color'>> {
	return prompts.map(mapPromptToRelated);
}
