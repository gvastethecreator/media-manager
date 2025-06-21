/**
 * @file Transformer para la entidad Tag
 * @module transformers/tag/transformer
 */

import type { TagWithStats } from '@/types/entities/tag/types';
import type { Prisma } from '@prisma/client';

export type PrismaTagWithCount = Prisma.TagGetPayload<{
	include: {
		_count: {
			select: {
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
			};
		};
	};
}>;

/**
 * Maps a Prisma Tag object (with counts) to the application-level TagWithStats type.
 * @param prismaTag - The Prisma object for a tag, including relation counts.
 * @returns The tag object with a calculated stats object, or null if input is null.
 */
export function fromPrismaTag(prismaTag: PrismaTagWithCount | null): TagWithStats | null {
	if (!prismaTag) {
		return null;
	}

	const { _count, ...baseTag } = prismaTag;

	const totalAssociations = Object.values(_count).reduce((sum, count) => sum + (count || 0), 0);

	return {
		...baseTag,
		// Aseguramos que los campos opcionales nulos se conviertan a undefined
		description: baseTag.description ?? undefined,
		shortcut: baseTag.shortcut ?? undefined,
		featuredImage: baseTag.featuredImage ?? undefined,
		_count,
		totalAssociations,
	};
}

/**
 * Transforma un array de Tag de Prisma a TagWithStats[]
 */
export function fromPrismaTags(prismaTags: PrismaTagWithCount[]): TagWithStats[] {
	return prismaTags.map(fromPrismaTag).filter((t): t is TagWithStats => t !== null);
}
