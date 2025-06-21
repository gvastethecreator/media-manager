/**
 * @file Transformer for Property entity
 * @module transformers/property/transformer
 * @description Contains functions to transform Prisma Property objects to application-level types.
 */
import type { PropertyWithStats } from '@/types/entities/property/types';
import type { Property } from '@prisma/client';

type PrismaPropertyWithCount = Property & {
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
		groups: number;
	};
};

/**
 * Transforms a Prisma Property object (with counts) to the application-level PropertyWithStats type.
 * @param prismaProperty - The Prisma object for a property, including relation counts.
 * @returns The property object with calculated stats.
 */
export function fromPrismaProperty(prismaProperty: PrismaPropertyWithCount): PropertyWithStats {
	const { _count, ...baseProperty } = prismaProperty;

	const totalAssociations = Object.values(_count || {}).reduce((sum, count) => sum + count, 0);

	return {
		...baseProperty,
		_count: _count || {}, // Ensure _count is always an object
		totalAssociations,
	};
}
