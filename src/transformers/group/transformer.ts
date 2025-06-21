/**
 * @file Transformer para la entidad Group
 * @module transformers/group/transformer
 */

'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import type { GroupWithStats, PrismaGroupWithCounts } from '@/types/entities/group/types';
import { TransformerError } from '@/utils/transformers/errors';

const logger = serverLogger.withContext('GroupTransformer');

/**
 * 👥 Transforma un objeto de grupo de Prisma a un objeto GroupWithStats,
 * calculando todas las estadísticas necesarias.
 *
 * @param prismaGroup - El objeto de grupo obtenido de Prisma, con los conteos.
 * @returns Un objeto GroupWithStats completo y seguro.
 */
export function fromPrismaGroup(prismaGroup: PrismaGroupWithCounts | null): GroupWithStats | null {
	if (!prismaGroup) {
		return null;
	}

	const counts = prismaGroup._count || {};

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

	let parsedFilters = [];
	if (typeof prismaGroup.filters === 'string') {
		try {
			const potentialFilters = JSON.parse(prismaGroup.filters);
			if (Array.isArray(potentialFilters)) {
				parsedFilters = potentialFilters;
			}
		} catch (error) {
			logger.warn(`⚠️ JSON inválido para filtros en el grupo ${prismaGroup.id}:`, prismaGroup.filters);
		}
	}

	return {
		...prismaGroup,
		filters: parsedFilters,
		stats,
	};
}

/**
 * 👥 Transforma múltiples grupos de Prisma.
 *
 * @param groups Array de grupos de Prisma.
 * @returns Array de grupos transformados a GroupWithStats.
 */
export function fromPrismaGroups(groups: PrismaGroupWithCounts[]): GroupWithStats[] {
	if (!Array.isArray(groups)) {
		logger.error('⚠️ Intentando transformar un array de grupos inválido:', groups);
		throw new TransformerError('Error transformando grupos: no es un array');
	}

	try {
		return groups.map((group) => fromPrismaGroup(group)).filter((g): g is GroupWithStats => g !== null);
	} catch (error) {
		logger.error('❌ Error transformando lista de grupos:', error);
		throw new TransformerError('Error transformando lista de grupos');
	}
}

// 🗑️ Eliminar funciones redundantes y propensas a errores.
// La función `fromPrismaGroup` ahora es la única fuente de verdad para la transformación.
/*
 * 🔄 Transforma un Group a la versión extendida para UI
 *
 * @param group Objeto Group a transformar
 * @param options Opciones adicionales de transformación
 * @returns Objeto GroupExtended con propiedades de UI
 * @throws Error si hay un problema en la transformación
 *
export function transformGroupToExtended(
	group: GroupComplete,
	options: {
		isSelected?: boolean;
		isHighlighted?: boolean;
		isEditing?: boolean;
		isExpanded?: boolean;
		isLoading?: boolean;
		hasError?: boolean;
		isDragging?: boolean;
		isDropTarget?: boolean;
	} = {}
): GroupExtended {
	try {
		// Opciones con valores por defecto
		const {
			isSelected = false,
			isHighlighted = false,
			isEditing = false,
			isExpanded = false,
			isLoading = false,
			hasError = false,
			isDragging = false,
			isDropTarget = false,
		} = options;

		// Extender con propiedades de UI
		return {
			...group,
			isSelected,
			isHighlighted,
			isEditing,
			isExpanded,
			isLoading,
			hasError,
			isDragging,
			isDropTarget,
		};
	} catch (error) {
		logger.error('❌ Error transformando Group a Extended:', error);
		throw new TransformerError('Error transformando grupo a versión extendida');
	}
}
*/

/*
 * 📊 Transforma un Group a la versión con estadísticas.
 *
 * @param group Objeto Group a transformar.
 * @returns Objeto GroupWithStats con estadísticas adicionales.
 * @throws Error si hay un problema en la transformación.
 *
export function transformGroupToWithStats(group: GroupComplete): GroupWithStats {
	try {
		const totalImages = group._count?.images || 0;
		const totalCollections = group._count?.collections || 0;
		const totalTags = group._count?.tags || 0;
		const totalPlaces = group._count?.places || 0;
		const totalWorldItems = group._count?.worldItems || 0;
		const totalConcepts = group._count?.concepts || 0;
		const totalPrompts = group._count?.prompts || 0;
		const totalNotes = group._count?.notes || 0;
		const totalWildcards = group._count?.wildcards || 0;
		const totalProperties = group._count?.properties || 0;

		const totalItems =
			totalImages +
			totalCollections +
			totalTags +
			totalPlaces +
			totalWorldItems +
			totalConcepts +
			totalPrompts +
			totalNotes +
			totalWildcards +
			totalProperties;

		return {
			...group,
			stats: {
				totalItems,
				totalImages,
				totalVideos: 0, // Campo existe en el tipo, pero no en el _count de Prisma para Group
				totalAlbums: 0, // Campo existe en el tipo, pero no en el _count de Prisma para Group
				totalCollections,
				totalTags,
				totalCharacters: 0, // Campo existe en el tipo, pero no en el _count de Prisma para Group
				totalPlaces,
				totalWorldItems,
				totalConcepts,
				totalPrompts,
				totalNotes,
				totalWildcards,
				totalProperties,
				lastUpdated: group.updatedAt,
			},
		};
	} catch (error) {
		logger.error('❌ Error transformando Group a WithStats:', error);
		throw new TransformerError('Error transformando grupo a versión con estadísticas');
	}
}
*/

