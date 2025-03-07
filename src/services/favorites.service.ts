import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import type { EntityType } from '@/types/entities';
import type {
	AddFavoriteParams,
	FavoriteEntity,
	FavoriteEvents,
	FavoriteFilters,
	FavoriteResult,
	FavoriteResults,
	FavoriteStats,
	GetFavoritesParams,
	RemoveFavoriteParams,
} from '@/types/favorites';

const favoritesLogger = logger.withContext('FavoritesService');

// Constantes para los tipos de eventos
const EVENTS = {
	FAVORITE_ADDED: 'favorite:added',
	FAVORITE_REMOVED: 'favorite:removed',
	FAVORITES_CHANGED: 'favorites:changed',
};

/**
 * Servicio para gestionar los favoritos
 * Migrado a usar serverEvents en lugar de EventEmitter
 */
export const FavoritesService = {
	async addFavorite(params: AddFavoriteParams): Promise<FavoriteEntity> {
		try {
			const { entityId, entityType } = params;

			// Verificar si ya existe
			const existing = await prisma.universalFavorite.findUnique({
				where: {
					entityId_entityType: {
						entityId,
						entityType,
					},
				},
			});

			if (existing) {
				return {
					...existing,
					entityType: existing.entityType as EntityType,
				};
			}

			// Crear nuevo favorito
			const favorite = await prisma.universalFavorite.create({
				data: {
					entityId,
					entityType,
				},
			});

			// Actualizar el campo isFavorite en la entidad
			await this.updateEntityFavoriteStatus(entityId, entityType, true);

			// Emitir eventos con el nuevo sistema
			await emit({
				type: 'favorites:modified',
				data: {
					action: 'add',
					entity: favorite,
					eventType: EVENTS.FAVORITE_ADDED,
				},
			});

			await emit({
				type: 'favorites:modified',
				data: {
					action: 'change',
					eventType: EVENTS.FAVORITES_CHANGED,
				},
			});

			return {
				...favorite,
				entityType: favorite.entityType as EntityType,
			};
		} catch (error) {
			favoritesLogger.error('Error adding favorite:', { params, error });
			throw new Error('Error al agregar favorito');
		}
	},

	async removeFavorite(params: RemoveFavoriteParams): Promise<void> {
		try {
			const { entityId, entityType } = params;

			// Eliminar favorito
			await prisma.universalFavorite.delete({
				where: {
					entityId_entityType: {
						entityId,
						entityType,
					},
				},
			});

			// Actualizar el campo isFavorite en la entidad
			await this.updateEntityFavoriteStatus(entityId, entityType, false);

			// Emitir eventos con el nuevo sistema
			await emit({
				type: 'favorites:modified',
				data: {
					action: 'remove',
					entityId,
					entityType,
					eventType: EVENTS.FAVORITE_REMOVED,
				},
			});

			await emit({
				type: 'favorites:modified',
				data: {
					action: 'change',
					eventType: EVENTS.FAVORITES_CHANGED,
				},
			});
		} catch (error) {
			favoritesLogger.error('Error removing favorite:', { params, error });
			throw new Error('Error al eliminar favorito');
		}
	},

	async getFavorites<T = unknown>(params: GetFavoritesParams = {}): Promise<FavoriteResults<T>> {
		try {
			const { filters = {}, includeEntity = false } = params;

			const { entityType, sortBy = 'createdAt', sortOrder = 'desc', page = 0, pageSize = 50 } = filters;

			// Construir where
			const where = entityType ? { entityType } : {};

			// Obtener total
			const total = await prisma.universalFavorite.count({ where });

			// Obtener favoritos
			const favorites = await prisma.universalFavorite.findMany({
				where,
				orderBy: {
					[sortBy]: sortOrder,
				},
				skip: page * pageSize,
				take: pageSize,
			});

			// Obtener estadísticas
			const stats = await this.getFavoriteStats();

			// Obtener entidades si se solicita
			let items: FavoriteResult<T>[] = favorites.map((favorite) => ({
				...favorite,
				entityType: favorite.entityType as EntityType,
				entity: null as T | null,
			}));

			if (includeEntity) {
				items = await Promise.all(
					items.map(async (favorite) => ({
						...favorite,
						entity: await this.getEntityById<T>(favorite.entityId, favorite.entityType),
					}))
				);
			}

			return {
				items,
				total,
				page,
				pageSize,
				stats,
			};
		} catch (error) {
			favoritesLogger.error('Error getting favorites:', { params, error });
			throw new Error('Error al obtener favoritos');
		}
	},

	async getFavoriteStats(): Promise<FavoriteStats> {
		try {
			const total = await prisma.universalFavorite.count();
			const byType = await prisma.universalFavorite.groupBy({
				by: ['entityType'],
				_count: true,
			});

			const stats: Record<EntityType, number> = {} as Record<EntityType, number>;
			for (const item of byType) {
				stats[item.entityType as EntityType] = item._count;
			}

			return {
				total,
				byType: stats,
			};
		} catch (error) {
			favoritesLogger.error('Error getting favorite stats:', error);
			throw new Error('Error al obtener estadísticas de favoritos');
		}
	},

	async updateEntityFavoriteStatus(entityId: string, entityType: EntityType, isFavorite: boolean): Promise<void> {
		try {
			switch (entityType) {
				case 'character':
					await prisma.character.update({
						where: { id: entityId },
						data: { isFavorite },
					});
					break;
				case 'place':
					await prisma.place.update({
						where: { id: entityId },
						data: { isFavorite },
					});
					break;
				case 'object':
					await prisma.object.update({
						where: { id: entityId },
						data: { isFavorite },
					});
					break;
				case 'collection':
					await prisma.collection.update({
						where: { id: entityId },
						data: { isFavorite },
					});
					break;
				case 'concept':
					await prisma.concept.update({
						where: { id: entityId },
						data: { isFavorite },
					});
					break;
				case 'prompt':
					await prisma.prompt.update({
						where: { id: entityId },
						data: { isFavorite },
					});
					break;
				case 'note':
					await prisma.note.update({
						where: { id: entityId },
						data: { isFavorite },
					});
					break;
				case 'attribute':
					await prisma.attribute.update({
						where: { id: entityId },
						data: { isFavorite },
					});
					break;
			}
		} catch (error) {
			favoritesLogger.error('Error updating entity favorite status:', {
				entityId,
				entityType,
				isFavorite,
				error,
			});
			throw new Error('Error al actualizar estado de favorito en la entidad');
		}
	},

	async getEntityById<T>(entityId: string, entityType: EntityType): Promise<T | null> {
		try {
			switch (entityType) {
				case 'character':
					return (await prisma.character.findUnique({
						where: { id: entityId },
						include: { images: true },
					})) as unknown as T;
				case 'place':
					return (await prisma.place.findUnique({
						where: { id: entityId },
						include: { images: true },
					})) as unknown as T;
				case 'object':
					return (await prisma.object.findUnique({
						where: { id: entityId },
						include: { images: true },
					})) as unknown as T;
				case 'collection':
					return (await prisma.collection.findUnique({
						where: { id: entityId },
						include: { images: true },
					})) as unknown as T;
				case 'concept':
					return (await prisma.concept.findUnique({
						where: { id: entityId },
					})) as unknown as T;
				case 'prompt':
					return (await prisma.prompt.findUnique({
						where: { id: entityId },
					})) as unknown as T;
				case 'note':
					return (await prisma.note.findUnique({
						where: { id: entityId },
					})) as unknown as T;
				case 'attribute':
					return (await prisma.attribute.findUnique({
						where: { id: entityId },
					})) as unknown as T;
				default:
					return null;
			}
		} catch (error) {
			favoritesLogger.error('Error getting entity by ID:', { entityId, entityType, error });
			return null;
		}
	},
};

export const favoritesService = FavoritesService;
