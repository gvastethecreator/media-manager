'use server';

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/server/auth';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats.service';
import type { FavoriteBase, FavoriteCreateInput } from '@/types/entities/favorite';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const logger = serverLogger.withContext('FavoriteActions');

const createFavoriteSchema = z.object({
	entityId: z.string().min(1),
	entityType: z.nativeEnum(FavoriteEntityType),
});

/**
 * Agrega una entidad a favoritos para el usuario actual.
 */
export async function addFavorite(input: FavoriteCreateInput): Promise<FavoriteBase> {
	const user = await getCurrentUser();
	if (!user) throw new Error('Not authenticated');

	const { entityId, entityType } = createFavoriteSchema.parse(input);

	logger.info(`⭐ User ${user.id} adding favorite`, { entityId, entityType });

	const existing = await prisma.favorite.findFirst({
		where: { userId: user.id, entityId, entityType },
	});

	if (existing) {
		logger.warn(`Favorite already exists for user ${user.id}`, { entityId, entityType });
		return existing;
	}

	const favorite = await prisma.favorite.create({
		data: {
			userId: user.id,
			entityId,
			entityType,
		},
	});

	statsEventEmitter.emit(STATS_EVENTS.FAVORITE_CHANGE, { action: 'add', entityType });
	revalidatePath('/favorites');

	return favorite;
}

/**
 * Elimina una entidad de favoritos para el usuario actual.
 */
export async function removeFavorite(entityId: string, entityType: FavoriteEntityType): Promise<void> {
	const user = await getCurrentUser();
	if (!user) throw new Error('Not authenticated');

	logger.info(`🗑️ User ${user.id} removing favorite`, { entityId, entityType });

	await prisma.favorite.deleteMany({
		where: {
			userId: user.id,
			entityId,
			entityType,
		},
	});

	statsEventEmitter.emit(STATS_EVENTS.FAVORITE_CHANGE, { action: 'remove', entityType });
	revalidatePath('/favorites');
}

/**
 * Obtiene todos los favoritos para el usuario actual.
 */
export async function getFavorites(): Promise<FavoriteBase[]> {
	const user = await getCurrentUser();
	if (!user) return [];

	logger.info(`📥 Getting favorites for user ${user.id}`);

	const favorites = await prisma.favorite.findMany({
		where: { userId: user.id },
		orderBy: { createdAt: 'desc' },
	});

	return favorites;
}

/**
 * Verifica si una entidad es favorita para el usuario actual.
 */
export async function isFavorite(entityId: string, entityType: FavoriteEntityType): Promise<boolean> {
	const user = await getCurrentUser();
	if (!user) return false;

	const count = await prisma.favorite.count({
		where: {
			userId: user.id,
			entityId,
			entityType,
		},
	});

	return count > 0;
}

/**
 * Alterna el estado de favorito de una entidad.
 */
export async function toggleFavorite(entityId: string, entityType: FavoriteEntityType): Promise<boolean> {
	const user = await getCurrentUser();
	if (!user) throw new Error('Not authenticated');

	const isCurrentlyFavorite = await isFavorite(entityId, entityType);

	if (isCurrentlyFavorite) {
		await removeFavorite(entityId, entityType);
		return false;
	} else {
		await addFavorite({ entityId, entityType, userId: user.id });
		return true;
	}
}
