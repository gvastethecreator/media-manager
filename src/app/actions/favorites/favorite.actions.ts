'use server';

/**
 * @file Server Actions para la entidad Favorite
 * @module app/actions/favorites/favorite.actions
 * @description Acciones para gestionar favoritos de diversas entidades.
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { fromPrismaFavorites } from '@/transformers/favorite';
import { type FavoriteComplete, FavoriteEntityType } from '@/types/entities/favorite';
import { revalidatePath } from 'next/cache';

const logger = serverLogger.withContext('FavoriteActions');

/**
 * Revalida las rutas de caché relacionadas con los favoritos.
 * @param entityType - El tipo de entidad.
 * @param entityId - El ID de la entidad.
 */
async function revalidateFavoritePaths(_entityType: FavoriteEntityType, _entityId: string) {
	revalidatePath('/favorites');
	// Opcionalmente, revalidar la página de la entidad específica
	// revalidatePath(`/${entityType.toLowerCase()}s/${entityId}`);
}

/**
 * Alterna el estado de favorito de una entidad.
 * Devuelve `true` si la entidad ahora es favorita, `false` si no lo es.
 */
export async function toggleFavorite(entityType: FavoriteEntityType, entityId: string): Promise<boolean> {
	logger.info(`❤️ Alternando favorito para ${entityType}:${entityId}`);
	const existing = await prisma.favorite.findFirst({
		where: { entityType, entityId },
	});

	if (existing) {
		await prisma.favorite.delete({ where: { id: existing.id } });
		logger.info(`💔 Favorito eliminado para ${entityType}:${entityId}`);
		await revalidateFavoritePaths(entityType, entityId);
		return false;
	}

	// Obtener el perfil activo (asumimos que hay un perfil por defecto)
	const defaultProfile = await prisma.profile.findFirst({
		where: { isActive: true },
		select: { id: true },
	});

	if (!defaultProfile) {
		logger.error('No se encontró un perfil activo para crear el favorito');
		throw new Error('No se encontró un perfil activo para crear el favorito');
	}

	const favorite = await prisma.favorite.create({
		data: {
			entityType,
			entityId,
			profile: { connect: { id: defaultProfile.id } },
		},
	});
	logger.info(`💖 Favorito añadido para ${entityType}:${entityId}`, favorite);
	await revalidateFavoritePaths(entityType, entityId);
	return true;
}

/**
 * Elimina un favorito específico.
 */
export async function deleteFavorite(entityType: FavoriteEntityType, entityId: string): Promise<void> {
	logger.warn(`🗑️ Eliminando favorito para ${entityType}:${entityId}`);
	await prisma.favorite.deleteMany({
		where: { entityType, entityId },
	});
	await revalidateFavoritePaths(entityType, entityId);
}

/**
 * Obtiene todos los favoritos, opcionalmente filtrados por tipo de entidad.
 */
export async function getFavorites(entityType?: FavoriteEntityType): Promise<FavoriteComplete[]> {
	logger.info('❤️ Obteniendo todos los favoritos', { entityType });
	const favorites = await prisma.favorite.findMany({
		where: entityType ? { entityType } : {},
	});
	return fromPrismaFavorites(favorites as any);
}

/**
 * Verifica si una entidad es favorita.
 */
export async function isFavorite(entityType: FavoriteEntityType, entityId: string): Promise<boolean> {
	const count = await prisma.favorite.count({
		where: { entityType, entityId },
	});
	return count > 0;
}

/**
 * Cuenta el número de favoritos, opcionalmente por tipo de entidad.
 */
export async function countFavorites(entityType?: FavoriteEntityType): Promise<number> {
	logger.info('❤️ Contando favoritos', { entityType });
	const count = await prisma.favorite.count({
		where: entityType ? { entityType } : {},
	});
	return count;
}
