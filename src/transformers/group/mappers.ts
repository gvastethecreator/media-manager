/**
 * @file Mappers para la entidad Group.
 * @module transformers/group/mappers
 * @description Contiene funciones para transformar datos de la entidad Group.
 */
import type { GroupStatistics, GroupWithStats } from '@/types/entities/group';
import type { Group } from '@prisma/client';

/**
 * Representa la estructura del objeto de agregación de conteos de Prisma para un Group.
 */
type GroupCounts = {
	_count: {
		images: number;
		videos: number;
		albums: number;
		collections: number;
		tags: number;
		characters: number;
		places: number;
		worldItems: number;
		concepts: number;
		prompts: number;
		notes: number;
		wildcards: number;
		properties: number;
	};
};

/**
 * Convierte un objeto Group de Prisma y sus conteos a un objeto canónico GroupWithStats.
 *
 * @param group El objeto Group de Prisma.
 * @param counts Los conteos de las relaciones del grupo.
 * @returns Un objeto GroupWithStats.
 */
export function toGroupWithStats(group: Group, counts: GroupCounts['_count']): GroupWithStats {
	const stats: GroupStatistics = {
		imageCount: counts.images,
		videoCount: counts.videos,
		albumCount: counts.albums,
		collectionCount: counts.collections,
		tagCount: counts.tags,
		characterCount: counts.characters,
		placeCount: counts.places,
		worldItemCount: counts.worldItems,
		conceptCount: counts.concepts,
		promptCount: counts.prompts,
		noteCount: counts.notes,
		wildcardCount: counts.wildcards,
		propertyCount: counts.properties,
	};

	return {
		...group,
		stats,
	};
}
