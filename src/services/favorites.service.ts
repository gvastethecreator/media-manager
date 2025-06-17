import { serverLogger } from '@/lib/logger/server-logger';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/server/events.server';
import type { EntityType } from '@/types/entities/entities';
import type {
	AddFavoriteParams,
	FavoriteEntity,
	FavoriteResult,
	FavoriteResults,
	FavoriteStats,
	GetFavoritesParams,
	RemoveFavoriteParams,
} from '@/types/favorites';

const favoritesLogger = serverLogger.withContext('FavoritesService');

// Constantes para los tipos de eventos
const EVENTS = {
	FAVORITE_ADDED: 'favorite:added',
	FAVORITE_REMOVED: 'favorite:removed',
	FAVORITES_CHANGED: 'favorites:changed',
};

/**
 * Servicio para gestionar los favoritos
 * Actualizado para usar directamente los campos isFavorite de cada entidad
 */
export const FavoritesService = {
	async addFavorite(params: AddFavoriteParams): Promise<FavoriteEntity> {
		try {
			const { entityId, entityType } = params;

			// Verificar si ya es favorito
			const entity = await this.getEntityById(entityId, entityType);
			if (!entity) {
				throw new Error(`La entidad ${entityType} con id ${entityId} no existe`);
			}

			// Si ya es favorito, retornar la entidad
			if (this.getEntityFavoriteStatus(entity)) {
				return {
					id: entityId,
					entityId,
					entityType,
					createdAt: this.getEntityCreatedAt(entity),
				};
			}

			// Actualizar el campo isFavorite en la entidad
			await this.updateEntityFavoriteStatus(entityId, entityType, true);

			// Obtener la entidad actualizada
			const updatedEntity = await this.getEntityById(entityId, entityType);
			if (!updatedEntity) {
				throw new Error('No se pudo obtener la entidad actualizada');
			}

			// Emitir eventos con el nuevo sistema
			await emit({
				type: 'favorites:modified',
				data: {
					action: 'add',
					entity: {
						id: entityId,
						entityId,
						entityType,
						createdAt: this.getEntityCreatedAt(updatedEntity),
					},
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
				id: entityId,
				entityId,
				entityType,
				createdAt: this.getEntityCreatedAt(updatedEntity),
			};
		} catch (error) {
			favoritesLogger.error('Error adding favorite:', { params, error });
			throw new Error('Error al agregar favorito');
		}
	},

	async removeFavorite(params: RemoveFavoriteParams): Promise<void> {
		try {
			const { entityId, entityType } = params;

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

			// Preparamos los resultados
			let items: FavoriteResult<T>[] = [];
			let total = 0;

			// Obtener favoritos según el tipo de entidad
			if (entityType) {
				const favoritesForType = await this.getFavoritesForEntityType(entityType, sortBy, sortOrder, page, pageSize);
				items = favoritesForType.items as FavoriteResult<T>[];
				total = favoritesForType.total;
			} else {
				// Obtener favoritos de todos los tipos
				const allTypeFavorites = await Promise.all([
					this.getFavoritesForEntityType('character', sortBy, sortOrder),
					this.getFavoritesForEntityType('place', sortBy, sortOrder),
					this.getFavoritesForEntityType('world-item', sortBy, sortOrder),
					this.getFavoritesForEntityType('collection', sortBy, sortOrder),
					this.getFavoritesForEntityType('concept', sortBy, sortOrder),
					this.getFavoritesForEntityType('prompt', sortBy, sortOrder),
					this.getFavoritesForEntityType('note', sortBy, sortOrder),
				]);

				// Combinar resultados
				const allItems = allTypeFavorites.flatMap((result) => result.items);

				// Ordenar por fecha de creación o el campo especificado
				allItems.sort((a, b) => {
					const dateA = new Date(a.createdAt);
					const dateB = new Date(b.createdAt);
					return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
				});

				// Paginación
				items = allItems.slice(page * pageSize, (page + 1) * pageSize) as FavoriteResult<T>[];
				total = allItems.length;
			}

			// Obtener estadísticas
			const stats = await this.getFavoriteStats();

			// Obtener entidades si se solicita
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
			// Contar entidades favoritas por tipo
			const characterCount = await prisma.character.count({ where: { isFavorite: true } });
			const placeCount = await prisma.place.count({ where: { isFavorite: true } });
			const worldItemCount = await prisma.worldItem.count({ where: { isFavorite: true } });
			const collectionCount = await prisma.collection.count({ where: { isFavorite: true } });
			const conceptCount = await prisma.concept.count({ where: { isFavorite: true } });
			const promptCount = await prisma.prompt.count({ where: { isFavorite: true } });
			const noteCount = await prisma.note.count({ where: { isFavorite: true } });

			const total =
				characterCount + placeCount + worldItemCount + collectionCount + conceptCount + promptCount + noteCount;

			const byType: Record<EntityType, number> = {
				character: characterCount,
				place: placeCount,
				'world-item': worldItemCount,
				collection: collectionCount,
				concept: conceptCount,
				prompt: promptCount,
				note: noteCount,
				album: 0, // No es favoritable, pero se incluye para completar el tipo
				uploadedImage: 0, // No es favoritable, pero se incluye para completar el tipo
			};

			return {
				total,
				byType,
			};
		} catch (error) {
			favoritesLogger.error('Error getting favorite stats:', error);
			throw new Error('Error al obtener estadísticas de favoritos');
		}
	},

	async getFavoritesForEntityType(
		entityType: EntityType,
		sortBy = 'createdAt',
		sortOrder = 'desc',
		page = 0,
		pageSize = 50
	): Promise<{ items: FavoriteResult<unknown>[]; total: number }> {
		try {
			let items: FavoriteResult<unknown>[] = [];
			let total = 0;

			// Obtener entidades con isFavorite=true según el tipo
			switch (entityType) {
				case 'character': {
					const [characters, count] = await Promise.all([
						prisma.character.findMany({
							where: { isFavorite: true },
							orderBy: { [sortBy]: sortOrder },
							skip: page * pageSize,
							take: pageSize,
						}),
						prisma.character.count({ where: { isFavorite: true } }),
					]);
					items = characters.map((char) => ({
						id: char.id,
						entityId: char.id,
						entityType,
						createdAt: char.createdAt,
						entity: null,
					}));
					total = count;
					break;
				}
				case 'place': {
					const [places, count] = await Promise.all([
						prisma.place.findMany({
							where: { isFavorite: true },
							orderBy: { [sortBy]: sortOrder },
							skip: page * pageSize,
							take: pageSize,
						}),
						prisma.place.count({ where: { isFavorite: true } }),
					]);
					items = places.map((place) => ({
						id: place.id,
						entityId: place.id,
						entityType,
						createdAt: place.createdAt,
						entity: null,
					}));
					total = count;
					break;
				}
				case 'world-item': {
					const [worldItems, count] = await Promise.all([
						prisma.worldItem.findMany({
							where: { isFavorite: true },
							orderBy: { [sortBy]: sortOrder },
							skip: page * pageSize,
							take: pageSize,
						}),
						prisma.worldItem.count({ where: { isFavorite: true } }),
					]);
					items = worldItems.map((item) => ({
						id: item.id,
						entityId: item.id,
						entityType,
						createdAt: item.createdAt,
						entity: null,
					}));
					total = count;
					break;
				}
				case 'collection': {
					const [collections, count] = await Promise.all([
						prisma.collection.findMany({
							where: { isFavorite: true },
							orderBy: { [sortBy]: sortOrder },
							skip: page * pageSize,
							take: pageSize,
						}),
						prisma.collection.count({ where: { isFavorite: true } }),
					]);
					items = collections.map((collection) => ({
						id: collection.id,
						entityId: collection.id,
						entityType,
						createdAt: collection.createdAt,
						entity: null,
					}));
					total = count;
					break;
				}
				case 'concept': {
					const [concepts, count] = await Promise.all([
						prisma.concept.findMany({
							where: { isFavorite: true },
							orderBy: { [sortBy]: sortOrder },
							skip: page * pageSize,
							take: pageSize,
						}),
						prisma.concept.count({ where: { isFavorite: true } }),
					]);
					items = concepts.map((concept) => ({
						id: concept.id,
						entityId: concept.id,
						entityType,
						createdAt: concept.createdAt,
						entity: null,
					}));
					total = count;
					break;
				}
				case 'prompt': {
					const [prompts, count] = await Promise.all([
						prisma.prompt.findMany({
							where: { isFavorite: true },
							orderBy: { [sortBy]: sortOrder },
							skip: page * pageSize,
							take: pageSize,
						}),
						prisma.prompt.count({ where: { isFavorite: true } }),
					]);
					items = prompts.map((prompt) => ({
						id: prompt.id,
						entityId: prompt.id,
						entityType,
						createdAt: prompt.createdAt,
						entity: null,
					}));
					total = count;
					break;
				}
				case 'note': {
					const [notes, count] = await Promise.all([
						prisma.note.findMany({
							where: { isFavorite: true },
							orderBy: { [sortBy]: sortOrder },
							skip: page * pageSize,
							take: pageSize,
						}),
						prisma.note.count({ where: { isFavorite: true } }),
					]);
					items = notes.map((note) => ({
						id: note.id,
						entityId: note.id,
						entityType,
						createdAt: note.createdAt,
						entity: null,
					}));
					total = count;
					break;
				}
			}

			return { items, total };
		} catch (error) {
			favoritesLogger.error('Error getting favorites for entity type:', { entityType, error });
			throw new Error(`Error al obtener favoritos para el tipo ${entityType}`);
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
				case 'world-item':
					await prisma.worldItem.update({
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
				case 'world-item':
					return (await prisma.worldItem.findUnique({
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
				default:
					return null;
			}
		} catch (error) {
			favoritesLogger.error('Error getting entity by ID:', { entityId, entityType, error });
			return null;
		}
	},

	// Función auxiliar para obtener el estado de favorito de una entidad
	getEntityFavoriteStatus(entity: unknown): boolean {
		if (!entity || typeof entity !== 'object') {
			return false;
		}
		return 'isFavorite' in entity ? !!(entity as { isFavorite: boolean }).isFavorite : false;
	},

	// Función auxiliar para obtener la fecha de creación de una entidad
	getEntityCreatedAt(entity: unknown): Date {
		if (!entity || typeof entity !== 'object') {
			return new Date();
		}
		return 'createdAt' in entity ? new Date((entity as { createdAt: Date }).createdAt) : new Date();
	},
};

export const favoritesService = FavoritesService;
