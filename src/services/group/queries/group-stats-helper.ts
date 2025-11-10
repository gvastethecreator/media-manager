/**
 * @file Helper para construir estadísticas de grupos
 * @module services/group/queries
 */

import { count, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { groupAlbums, groupImages, groups, groupTags, groupVideos } from '@/lib/drizzle/schema/index';
import type { GroupWithStats } from '@/types/entities/group/types';

/**
 * Construye un objeto GroupWithStats a partir de un grupo base con sus estadísticas
 */
export async function buildGroupWithStats(group: typeof groups.$inferSelect): Promise<GroupWithStats> {
	const [imageCount, videoCount, albumCount, tagCount] = await Promise.all([
		db
			.select({ count: count() })
			.from(groupImages)
			.where(eq(groupImages.A, group.id))
			.then((res: { count: number }[]) => res[0]?.count || 0),
		db
			.select({ count: count() })
			.from(groupVideos)
			.where(eq(groupVideos.A, group.id))
			.then((res: { count: number }[]) => res[0]?.count || 0),
		db
			.select({ count: count() })
			.from(groupAlbums)
			.where(eq(groupAlbums.A, group.id))
			.then((res: { count: number }[]) => res[0]?.count || 0),
		db
			.select({ count: count() })
			.from(groupTags)
			.where(eq(groupTags.A, group.id))
			.then((res: { count: number }[]) => res[0]?.count || 0),
	]);

	return {
		...group,
		_count: {
			images: imageCount,
			videos: videoCount,
			albums: albumCount,
			tags: tagCount,
			collections: 0,
			characters: 0,
			places: 0,
			worldItems: 0,
			concepts: 0,
			prompts: 0,
			notes: 0,
			wildcards: 0,
			properties: 0,
			groups: 0,
		},
	} as GroupWithStats;
}

/**
 * Crea un objeto GroupWithStats con estadísticas vacías
 */
export function createEmptyGroupWithStats(group: typeof groups.$inferSelect): GroupWithStats {
	return {
		...group,
		_count: {
			images: 0,
			videos: 0,
			albums: 0,
			tags: 0,
			collections: 0,
			characters: 0,
			places: 0,
			worldItems: 0,
			concepts: 0,
			prompts: 0,
			notes: 0,
			wildcards: 0,
			properties: 0,
			groups: 0,
		},
	} as GroupWithStats;
}
