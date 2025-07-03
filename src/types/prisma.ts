/**
 * @file Tipos de Prisma para el proyecto
 * @module types/prisma
 */

import type { Prisma } from '@prisma/client';

// Re-exportar tipos de Prisma comúnmente utilizados
export type {
	Album,
	Character,
	Collection,
	Concept,
	File3D,
	Group,
	Image,
	Note,
	Place,
	Prisma,
	Prompt,
	Property,
	QueueJob,
	Tag,
	Wildcard,
	WorldItem,
} from '@prisma/client';

// Tipos de consultas comúnmente utilizados
export type ImageWithRelations = Prisma.ImageGetPayload<{
	include: {
		tags: true;
		collections: true;
		albums: true;
		characters: true;
		places: true;
		worldItems: true;
		concepts: true;
		prompts: true;
		notes: true;
		groups: true;
		properties: true;
		wildcards: true;
	};
}>;

export type TagWithCounts = Prisma.TagGetPayload<{
	include: {
		_count: {
			select: {
				images: true;
				albums: true;
				collections: true;
				characters: true;
			};
		};
	};
}>;

export type CollectionWithCounts = Prisma.CollectionGetPayload<{
	include: {
		_count: {
			select: {
				images: true;
			};
		};
	};
}>;

export type AlbumWithCounts = Prisma.AlbumGetPayload<{
	include: {
		_count: {
			select: {
				images: true;
			};
		};
	};
}>;

// Tipos de operaciones de Prisma
export type CreateImageInput = Prisma.ImageCreateInput;
export type UpdateImageInput = Prisma.ImageUpdateInput;
export type CreateTagInput = Prisma.TagCreateInput;
export type UpdateTagInput = Prisma.TagUpdateInput;
