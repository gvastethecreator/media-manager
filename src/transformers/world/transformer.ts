/**
 * @file Transformer for the World entity
 * @module transformers/world
 * @description Contains functions to transform World data between Prisma and canonical types.
 */

import { World as PrismaWorld } from '@prisma/client';
import { World, WorldListItem } from '@/types/entities/world';

/**
 * Transforms a Prisma World object into a canonical World object.
 * @param prismaWorld The World object from Prisma.
 * @returns The canonical World object.
 */
export const fromPrismaWorld = (prismaWorld: PrismaWorld): World => {
	return {
		id: prismaWorld.id,
		name: prismaWorld.name,
		description: prismaWorld.description,
		coverImage: prismaWorld.coverImage,
		isFavorite: prismaWorld.isFavorite,
		createdAt: prismaWorld.createdAt,
		updatedAt: prismaWorld.updatedAt,
	};
};

/**
 * Transforms an array of Prisma World objects into an array of canonical World objects.
 * @param prismaWorlds The array of World objects from Prisma.
 * @returns The array of canonical World objects.
 */
export const fromPrismaWorlds = (prismaWorlds: PrismaWorld[]): World[] => {
	return prismaWorlds.map(fromPrismaWorld);
};

/**
 * Transforms a Prisma World object into a canonical WorldListItem object.
 * @param prismaWorld The World object from Prisma.
 * @returns The canonical WorldListItem object.
 */
export const toWorldListItem = (prismaWorld: PrismaWorld): WorldListItem => {
	return {
		id: prismaWorld.id,
		name: prismaWorld.name,
		coverImage: prismaWorld.coverImage,
		isFavorite: prismaWorld.isFavorite,
		itemType: 'world',
	};
};