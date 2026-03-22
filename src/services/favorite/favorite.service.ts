/**
 * @file Servicio para la gestión de favoritos
 * @module services/favorite
 */

import * as crypto from 'crypto';
import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import {
	albums,
	audios,
	characters,
	collections,
	concepts,
	documents,
	favorites,
	file3Ds,
	groups,
	images,
	jsonFiles,
	notes,
	places,
	prompts,
	properties,
	tags,
	videos,
	wildcards,
	worldItems,
} from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import { FavoriteEntityType, type FavoriteWithStats } from '@/types/entities/favorite';

const favoriteLogger = serverLogger.withContext('FavoriteService');

// Tipo para el resultado de la consulta de favoritos
interface FavoriteRecord {
	addedAt: Date;
	entityId: string;
	entityType: string;
	id: string;
}

// Mapeo de entity type a tabla
const entityTableMap: Record<string, any> = {
	image: images,
	video: videos,
	album: albums,
	character: characters,
	place: places,
	worldItem: worldItems,
	concept: concepts,
	note: notes,
	prompt: prompts,
	tag: tags,
	group: groups,
	collection: collections,
	property: properties,
	wildcard: wildcards,
	audio: audios,
	document: documents,
	file3d: file3Ds,
	jsonFile: jsonFiles,
};

// Constantes para los tipos de eventos
const EVENTS = {
	FAVORITE_TOGGLED: 'favorite:toggled',
	FAVORITES_CHANGED: 'favorites:changed',
};

// Mapeo de eventos a EventType
const EVENT_TYPE_MAPPING: Record<string, EventType> = {
	[EVENTS.FAVORITE_TOGGLED]: 'favorites:modified',
	[EVENTS.FAVORITES_CHANGED]: 'favorites:modified',
};

export interface FavoriteFilters {
	entityType?: string;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: 'addedAt' | 'entityType';
	sortOrder?: 'asc' | 'desc';
}

export interface FavoriteResult {
	hasMore: boolean;
	items: FavoriteWithStats[];
	total: number;
}

/**
 * Servicio para gestionar los favoritos
 */
export const favoriteService = {
	/**
	 * Alternar el estado de favorito de una entidad
	 */
	async toggle(entityType: FavoriteEntityType, entityId: string): Promise<{ isFavorite: boolean; id?: string }> {
		try {
			favoriteLogger.info('Alternando favorito:', { entityType, entityId });

			// Verificar si ya existe
			const existing = await db
				.select()
				.from(favorites)
				.where(and(eq(favorites.entityType, entityType), eq(favorites.entityId, entityId)))
				.limit(1);

			if (existing.length > 0) {
				// Eliminar favorito existente
				await db.delete(favorites).where(eq(favorites.id, existing[0].id));

				// También actualizar isFavorite en la entidad si existe el campo
				await this.updateEntityIsFavorite(entityType, entityId, false);

				await emit({
					type: EVENT_TYPE_MAPPING[EVENTS.FAVORITE_TOGGLED],
					data: { action: 'removed', entityType, entityId },
				});

				favoriteLogger.info('Favorito eliminado:', { entityType, entityId });
				return { isFavorite: false };
			}

			// Crear nuevo favorito
			const id = crypto.randomUUID();
			await db.insert(favorites).values({
				id,
				entityType,
				entityId,
				addedAt: new Date(),
			});

			// También actualizar isFavorite en la entidad si existe el campo
			await this.updateEntityIsFavorite(entityType, entityId, true);

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.FAVORITE_TOGGLED],
				data: { action: 'added', entityType, entityId, id },
			});

			favoriteLogger.info('Favorito añadido:', { entityType, entityId, id });
			return { isFavorite: true, id };
		} catch (error) {
			favoriteLogger.error('Error al alternar favorito:', error);
			throw new Error('Error al alternar favorito');
		}
	},

	/**
	 * Verificar si una entidad es favorita
	 */
	async isFavorite(entityType: FavoriteEntityType, entityId: string): Promise<boolean> {
		const result = await db
			.select({ id: favorites.id })
			.from(favorites)
			.where(and(eq(favorites.entityType, entityType), eq(favorites.entityId, entityId)))
			.limit(1);

		return result.length > 0;
	},

	/**
	 * Obtener todos los favoritos con filtros
	 */
	async list(filters: FavoriteFilters = {}): Promise<FavoriteResult> {
		const { entityType, limit = 50, offset = 0, sortOrder = 'desc' } = filters;

		try {
			const conditions = [];
			if (entityType) {
				conditions.push(eq(favorites.entityType, entityType));
			}

			const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

			const [items, totalResult] = await Promise.all([
				db
					.select()
					.from(favorites)
					.where(whereClause)
					.orderBy(sortOrder === 'desc' ? desc(favorites.addedAt) : favorites.addedAt)
					.limit(limit)
					.offset(offset),
				db.select({ count: count() }).from(favorites).where(whereClause),
			]);

			const total = totalResult[0]?.count ?? 0;

			// Enriquecer con datos de la entidad
			const enrichedItems: FavoriteWithStats[] = await Promise.all(
				items.map(async (fav: FavoriteRecord) => {
					const entityData = await this.getEntityData(fav.entityType as FavoriteEntityType, fav.entityId);
					return {
						...fav,
						addedAt: fav.addedAt,
						entityName: entityData?.name || 'Desconocido',
						entityThumbnail: entityData?.thumbnail || null,
						stats: {
							daysSinceAdded: Math.floor((Date.now() - fav.addedAt.getTime()) / (1000 * 60 * 60 * 24)),
						},
					};
				})
			);

			return {
				items: enrichedItems,
				total,
				hasMore: offset + limit < total,
			};
		} catch (error) {
			favoriteLogger.error('Error al listar favoritos:', error);
			throw new Error('Error al listar favoritos');
		}
	},

	/**
	 * Obtener un favorito por ID
	 */
	async getById(id: string): Promise<FavoriteWithStats | null> {
		try {
			const result = await db.select().from(favorites).where(eq(favorites.id, id)).limit(1);

			if (result.length === 0) return null;

			const fav = result[0];
			const entityData = await this.getEntityData(fav.entityType as FavoriteEntityType, fav.entityId);

			return {
				...fav,
				entityName: entityData?.name || 'Desconocido',
				entityThumbnail: entityData?.thumbnail || null,
				stats: {
					daysSinceAdded: Math.floor((Date.now() - fav.addedAt.getTime()) / (1000 * 60 * 60 * 24)),
				},
			};
		} catch (error) {
			favoriteLogger.error('Error al obtener favorito:', error);
			return null;
		}
	},

	/**
	 * Eliminar un favorito por ID
	 */
	async delete(id: string): Promise<boolean> {
		try {
			const existing = await db.select().from(favorites).where(eq(favorites.id, id)).limit(1);

			if (existing.length === 0) return false;

			const fav = existing[0];
			await db.delete(favorites).where(eq(favorites.id, id));

			// Actualizar isFavorite en la entidad
			await this.updateEntityIsFavorite(fav.entityType as FavoriteEntityType, fav.entityId, false);

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.FAVORITE_TOGGLED],
				data: { action: 'removed', entityType: fav.entityType, entityId: fav.entityId },
			});

			return true;
		} catch (error) {
			favoriteLogger.error('Error al eliminar favorito:', error);
			return false;
		}
	},

	/**
	 * Obtener datos básicos de la entidad
	 */
	async getEntityData(
		entityType: FavoriteEntityType,
		entityId: string
	): Promise<{ name: string; thumbnail?: string | null } | null> {
		try {
			const table = entityTableMap[entityType];
			if (!table) return null;

			const result = await db.select().from(table).where(eq(table.id, entityId)).limit(1);

			if (result.length === 0) return null;

			const entity = result[0];
			return {
				name: entity.name || entity.title || `${entityType} ${entityId.slice(0, 8)}`,
				thumbnail: entity.thumbnailPath || entity.featuredImage || entity.path || null,
			};
		} catch (error) {
			favoriteLogger.error('Error al obtener datos de entidad:', error);
			return null;
		}
	},

	/**
	 * Actualizar el campo isFavorite en la entidad si existe
	 */
	async updateEntityIsFavorite(entityType: FavoriteEntityType, entityId: string, isFavorite: boolean): Promise<void> {
		try {
			const table = entityTableMap[entityType];
			if (!table) return;

			// Verificar si la tabla tiene el campo isFavorite
			if ('isFavorite' in table) {
				await db.update(table).set({ isFavorite }).where(eq(table.id, entityId));
			}
		} catch (error) {
			// Ignorar errores si la tabla no tiene el campo isFavorite
			favoriteLogger.debug('No se pudo actualizar isFavorite en entidad (campo puede no existir):', error);
		}
	},

	/**
	 * Obtener conteo de favoritos por tipo
	 */
	async getCountsByType(): Promise<Record<string, number>> {
		try {
			const results = await db
				.select({
					entityType: favorites.entityType,
					count: count(),
				})
				.from(favorites)
				.groupBy(favorites.entityType);

			const counts: Record<string, number> = {};
			for (const row of results) {
				counts[row.entityType] = row.count;
			}
			return counts;
		} catch (error) {
			favoriteLogger.error('Error al obtener conteos de favoritos:', error);
			return {};
		}
	},
};

export default favoriteService;
