/**
 * @file Funciones para transformar entidades de Drizzle a Prisma
 * @module transformers/drizzle/drizzle-to-prisma
 */

import type * as DrizzleTypes from '@/types/drizzle';
import type * as PrismaTypes from '@/types/entities';

/**
 * Transforma un grupo de Drizzle a formato Prisma
 * @param drizzleGroup Grupo en formato Drizzle
 * @returns Grupo en formato Prisma
 */
export function transformGroupToPrisma(drizzleGroup: DrizzleTypes.GroupEntity): PrismaTypes.Group {
	return {
		id: drizzleGroup.id,
		name: drizzleGroup.name,
		description: drizzleGroup.description,
		emoji: drizzleGroup.emoji,
		color: drizzleGroup.color,
		shortcut: drizzleGroup.shortcut,
		category: drizzleGroup.category,
		sortBy: drizzleGroup.sortBy,
		filters: drizzleGroup.filters,
		featuredImage: drizzleGroup.featuredImage,
		isFavorite: drizzleGroup.isFavorite,
		createdAt: drizzleGroup.createdAt,
		updatedAt: drizzleGroup.updatedAt,
	};
}

/**
 * Transforma una propiedad de Drizzle a formato Prisma
 * @param drizzleProperty Propiedad en formato Drizzle
 * @returns Propiedad en formato Prisma
 */
export function transformPropertyToPrisma(drizzleProperty: DrizzleTypes.PropertyEntity): PrismaTypes.Property {
	// Crear la propiedad Prisma, excluyendo campos específicos de Drizzle
	const prismaProperty: PrismaTypes.Property = {
		id: drizzleProperty.id,
		name: drizzleProperty.name,
		description: drizzleProperty.description,
		emoji: drizzleProperty.emoji,
		color: drizzleProperty.color,
		shortcut: drizzleProperty.shortcut,
		category: drizzleProperty.category,
		featuredImage: drizzleProperty.featuredImage,
		isFavorite: drizzleProperty.isFavorite,
		createdAt: drizzleProperty.createdAt,
		updatedAt: drizzleProperty.updatedAt,
	};

	return prismaProperty;
}

/**
 * Transforma un comodín de Drizzle a formato Prisma
 * @param drizzleWildcard Comodín en formato Drizzle
 * @returns Comodín en formato Prisma
 */
export function transformWildcardToPrisma(drizzleWildcard: DrizzleTypes.WildcardEntity): PrismaTypes.Wildcard {
	return {
		id: drizzleWildcard.id,
		name: drizzleWildcard.name,
		description: drizzleWildcard.description,
		emoji: drizzleWildcard.emoji,
		color: drizzleWildcard.color,
		shortcut: drizzleWildcard.shortcut,
		category: drizzleWildcard.category,
		children: drizzleWildcard.children,
		featuredImage: drizzleWildcard.featuredImage,
		isFavorite: drizzleWildcard.isFavorite,
		parentId: drizzleWildcard.parentId,
		createdAt: drizzleWildcard.createdAt,
		updatedAt: drizzleWildcard.updatedAt,
	};
}

/**
 * Transforma un trabajo en cola de Drizzle a formato Prisma
 * @param drizzleQueueJob Trabajo en cola en formato Drizzle
 * @returns Trabajo en cola en formato Prisma
 */
export function transformQueueJobToPrisma(drizzleQueueJob: DrizzleTypes.QueueJobEntity): PrismaTypes.QueueJob {
	// Parsear JSON si es necesario
	let parsedData: any;
	try {
		parsedData = JSON.parse(drizzleQueueJob.data);
	} catch (e) {
		parsedData = drizzleQueueJob.data;
	}

	// Parsear metadatos si existen
	let parsedMetadata: any = null;
	if (drizzleQueueJob.metadata) {
		try {
			parsedMetadata = JSON.parse(drizzleQueueJob.metadata);
		} catch (e) {
			parsedMetadata = drizzleQueueJob.metadata;
		}
	}

	return {
		id: drizzleQueueJob.id,
		queue: drizzleQueueJob.queue,
		data: parsedData,
		status: drizzleQueueJob.status,
		attempts: drizzleQueueJob.attempts,
		maxAttempts: drizzleQueueJob.maxAttempts,
		error: drizzleQueueJob.error,
		progress: drizzleQueueJob.progress,
		startedAt: drizzleQueueJob.startedAt,
		finishedAt: drizzleQueueJob.finishedAt,
		priority: drizzleQueueJob.priority,
		metadata: parsedMetadata,
		retryAt: drizzleQueueJob.retryAt,
		createdAt: drizzleQueueJob.createdAt,
		updatedAt: drizzleQueueJob.updatedAt,
	};
}
