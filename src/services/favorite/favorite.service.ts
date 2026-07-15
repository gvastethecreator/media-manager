/**
 * @file Servicio para la gestión de favoritos
 * @module services/favorite
 * @deprecated La verdad canónica está en la tabla `favorites` (junction table scoped a perfil).
 * `isFavorite` embebido en 20+ entidades es deuda/derivación, no verdad primaria.
 * El batch bridge Favorite debe eliminar esta dualidad: un solo contrato canónico
 * de lectura/escritura, `isFavorite` como proyección derivada o eliminado.
 * Ver ADR-0002 y 04-favorite-bridge.md.
 */

import * as crypto from 'crypto';
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';
import { db, getDbClient } from '@/lib/drizzle';
import {
	albums,
	audios,
	characters,
	collections,
	concepts,
	documents,
	favorites,
	file3Ds,
	folders,
	groups,
	images,
	jsonFiles,
	notes,
	places,
	properties,
	profiles,
	prompts,
	tags,
	videos,
	wildcards,
	worldItems,
} from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { type EventType, emit } from '@/lib/server/events.server';
import {
	CANONICAL_FAVORITE_ENTITY_TYPES,
	FAVORITE_ENTITY_DISPLAY_NAMES,
	FavoriteEntityType,
	isCanonicalFavoriteEntityType,
	type FavoriteWithStats,
} from '@/types/entities/favorite';

const favoriteLogger = serverLogger.withContext('FavoriteService');
const canonicalFavoriteEntityTypes: FavoriteEntityType[] = [...CANONICAL_FAVORITE_ENTITY_TYPES];

type FavoriteProjectionCapableEntity = { id: string; isFavorite?: boolean | null };

// Tipo para el resultado de la consulta de favoritos
interface FavoriteRecord {
	addedAt: Date;
	entityId: string;
	entityType: FavoriteEntityType;
	id: string;
	profileId: string;
}

// Mapeo de entity type a tabla
const entityTableMap: Record<FavoriteEntityType, any> = {
	[FavoriteEntityType.IMAGE]: images,
	[FavoriteEntityType.VIDEO]: videos,
	[FavoriteEntityType.AUDIO]: audios,
	[FavoriteEntityType.DOCUMENT]: documents,
	[FavoriteEntityType.JSON_FILE]: jsonFiles,
	[FavoriteEntityType.FILE_3D]: file3Ds,
	[FavoriteEntityType.ALBUM]: albums,
	[FavoriteEntityType.COLLECTION]: collections,
	[FavoriteEntityType.FOLDER]: folders,
	[FavoriteEntityType.GROUP]: groups,
	[FavoriteEntityType.TAG]: tags,
	[FavoriteEntityType.CHARACTER]: characters,
	[FavoriteEntityType.PLACE]: places,
	[FavoriteEntityType.WORLD_ITEM]: worldItems,
	[FavoriteEntityType.CONCEPT]: concepts,
	[FavoriteEntityType.PROPERTY]: properties,
	[FavoriteEntityType.PROMPT]: prompts,
	[FavoriteEntityType.NOTE]: notes,
	[FavoriteEntityType.WILDCARD]: wildcards,
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

let favoriteSchemaValidatedPromise: Promise<void> | null = null;

export interface FavoriteFilters {
	entityType?: FavoriteEntityType;
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

function createFavoriteIdSet(favoriteEntityIds: readonly string[] | ReadonlySet<string>): ReadonlySet<string> {
	return favoriteEntityIds instanceof Set ? favoriteEntityIds : new Set(favoriteEntityIds);
}

function applyFavoriteProjection<TEntity extends FavoriteProjectionCapableEntity>(
	entity: TEntity,
	favoriteEntityIds: readonly string[] | ReadonlySet<string>
): TEntity & { isFavorite: boolean } {
	const favoriteIdSet = createFavoriteIdSet(favoriteEntityIds);

	return {
		...entity,
		isFavorite: favoriteIdSet.has(entity.id),
	};
}

function applyFavoriteProjectionMany<TEntity extends FavoriteProjectionCapableEntity>(
	entities: TEntity[],
	favoriteEntityIds: readonly string[] | ReadonlySet<string>
): Array<TEntity & { isFavorite: boolean }> {
	const favoriteIdSet = createFavoriteIdSet(favoriteEntityIds);

	return entities.map((entity) => ({
		...entity,
		isFavorite: favoriteIdSet.has(entity.id),
	}));
}

function readPragmaField(row: unknown, field: string): unknown {
	if (!row || typeof row !== 'object') {
		return undefined;
	}

	const record = row as Record<string, unknown>;
	return record[field];
}

const FAVORITE_COLUMN_CONTRACT = [
	{ name: 'id', notNull: 1, primaryKey: 1, type: 'TEXT' },
	{ name: 'profileId', notNull: 1, primaryKey: 0, type: 'TEXT' },
	{ name: 'entityType', notNull: 1, primaryKey: 0, type: 'TEXT' },
	{ name: 'entityId', notNull: 1, primaryKey: 0, type: 'TEXT' },
	{ name: 'addedAt', notNull: 1, primaryKey: 0, type: 'INTEGER' },
] as const;

const FAVORITE_UNIQUE_INDEX = 'Favorite_profileId_entityType_entityId_key';
const FAVORITE_UNIQUE_COLUMNS = ['profileId', 'entityType', 'entityId'] as const;

function hasCanonicalFavoriteColumns(rows: readonly unknown[]): boolean {
	if (rows.length !== FAVORITE_COLUMN_CONTRACT.length) return false;
	return FAVORITE_COLUMN_CONTRACT.every((expected, index) => {
		const row = rows[index];
		return (
			readPragmaField(row, 'name') === expected.name &&
			String(readPragmaField(row, 'type')).toUpperCase() === expected.type &&
			Number(readPragmaField(row, 'notnull')) === expected.notNull &&
			Number(readPragmaField(row, 'pk')) === expected.primaryKey
		);
	});
}

function hasCanonicalFavoriteUniqueIndex(indexRow: unknown, indexInfoRows: readonly unknown[]): boolean {
	if (
		Number(readPragmaField(indexRow, 'unique')) !== 1 ||
		Number(readPragmaField(indexRow, 'partial')) !== 0 ||
		readPragmaField(indexRow, 'origin') !== 'c'
	) {
		return false;
	}

	const keyColumns = indexInfoRows
		.filter((row) => Number(readPragmaField(row, 'key')) === 1)
		.toSorted((left, right) => Number(readPragmaField(left, 'seqno')) - Number(readPragmaField(right, 'seqno')));
	if (keyColumns.length !== FAVORITE_UNIQUE_COLUMNS.length) return false;

	return FAVORITE_UNIQUE_COLUMNS.every(
		(expectedName, index) =>
			readPragmaField(keyColumns[index], 'name') === expectedName &&
			Number(readPragmaField(keyColumns[index], 'desc')) === 0 &&
			readPragmaField(keyColumns[index], 'coll') === 'BINARY'
	);
}

async function getActiveProfileIdOrNull(): Promise<string | null> {
	const activeProfile = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true)).limit(1);
	return activeProfile[0]?.id ?? null;
}

async function requireActiveProfileId(): Promise<string> {
	const profileId = await getActiveProfileIdOrNull();

	if (!profileId) {
		throw new Error('No hay un perfil activo para resolver favoritos');
	}

	return profileId;
}

function ensureCanonicalFavoriteEntityType(entityType: FavoriteEntityType): void {
	if (!isCanonicalFavoriteEntityType(entityType)) {
		throw new Error(`El tipo de favorito ${entityType} no pertenece al perímetro canónico`);
	}
}

async function validateFavoriteProfileScopeSchema(): Promise<void> {
	if (favoriteSchemaValidatedPromise) {
		return favoriteSchemaValidatedPromise;
	}

	favoriteSchemaValidatedPromise = (async () => {
		const client = getDbClient();
		if (!client) return;

		const columns = await client.execute('PRAGMA table_info("Favorite")');
		const indexes = await client.execute('PRAGMA index_list("Favorite")');
		const profileEntityIndex = indexes.rows.find((row) => readPragmaField(row, 'name') === FAVORITE_UNIQUE_INDEX);
		const profileEntityIndexInfo = profileEntityIndex
			? await client.execute(`PRAGMA index_xinfo("${FAVORITE_UNIQUE_INDEX}")`)
			: { rows: [] };
		if (
			!hasCanonicalFavoriteColumns(columns.rows) ||
			!hasCanonicalFavoriteUniqueIndex(profileEntityIndex, profileEntityIndexInfo.rows)
		) {
			throw new Error(
				'El schema Favorite no es canónico. Ejecuta db:check y db:adopt-legacy sobre un backup antes de iniciar la aplicación.'
			);
		}
	})().catch((error) => {
		favoriteSchemaValidatedPromise = null;
		throw error;
	});

	return favoriteSchemaValidatedPromise;
}

function buildFavoriteStats(entityType: FavoriteEntityType, addedAt: Date) {
	const normalizedAddedAt = new Date(addedAt);
	const daysSinceAdded = Math.floor((Date.now() - normalizedAddedAt.getTime()) / (1000 * 60 * 60 * 24));

	return {
		daysSinceAdded,
		entityTypeName: FAVORITE_ENTITY_DISPLAY_NAMES[entityType] ?? entityType,
		formattedAddedAt: normalizedAddedAt.toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}),
		isRecent: daysSinceAdded <= 7,
		isOld: daysSinceAdded > 30,
	};
}

async function getEntityData(
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
}

async function ensureFavoriteTargetExists(entityType: FavoriteEntityType, entityId: string): Promise<void> {
	const table = entityTableMap[entityType];

	if (!table) {
		throw new Error(`Tipo de favorito no soportado: ${entityType}`);
	}

	const result = await db.select({ id: table.id }).from(table).where(eq(table.id, entityId)).limit(1);

	if (result.length === 0) {
		throw new Error(`No existe la entidad favorita ${entityType}:${entityId}`);
	}
}

async function ensureFavoriteTargetsExist(entityType: FavoriteEntityType, entityIds: string[]): Promise<string[]> {
	const table = entityTableMap[entityType];

	if (!table) {
		throw new Error(`Tipo de favorito no soportado: ${entityType}`);
	}

	const uniqueEntityIds = [...new Set(entityIds.filter((entityId) => entityId.trim().length > 0))];

	if (uniqueEntityIds.length === 0) {
		return [];
	}

	const result = await db.select({ id: table.id }).from(table).where(inArray(table.id, uniqueEntityIds));
	const existingIds = new Set(result.map((row: { id: string }) => row.id));
	const missingIds = uniqueEntityIds.filter((entityId) => !existingIds.has(entityId));

	if (missingIds.length > 0) {
		throw new Error(`No existen las entidades favoritas ${entityType}:${missingIds.join(',')}`);
	}

	return uniqueEntityIds;
}

async function updateEntityIsFavorite(
	_entityType: FavoriteEntityType,
	_entityId: string,
	_isFavorite: boolean
): Promise<void> {
	// @deprecated isFavorite embebido: la sincronización dual fue desactivada.
	// La tabla canónica `favorites` es la única fuente de verdad desde batch bridge Favorite.
	// El flag `isFavorite` en tablas per-type queda como columna legacy (solo lectura).
	// Si alguna vista necesita el flag, debe proyectarlo desde la tabla favorites.
}

async function updateEntityIsFavoriteMany(
	_entityType: FavoriteEntityType,
	_entityIds: string[],
	_isFavorite: boolean
): Promise<void> {
	// @deprecated isFavorite embebido: la sincronización dual fue desactivada.
	// Ver updateEntityIsFavorite para el rationale completo.
}

async function getExistingFavoriteRecord(profileId: string, entityType: FavoriteEntityType, entityId: string) {
	const existing = await db
		.select({
			id: favorites.id,
			entityId: favorites.entityId,
			entityType: favorites.entityType,
		})
		.from(favorites)
		.where(
			and(eq(favorites.profileId, profileId), eq(favorites.entityType, entityType), eq(favorites.entityId, entityId))
		)
		.limit(1);

	return existing[0] ?? null;
}

async function enrichFavorite(favorite: FavoriteRecord): Promise<FavoriteWithStats> {
	const entityData = await getEntityData(favorite.entityType, favorite.entityId);

	return {
		...favorite,
		entityName: entityData?.name || FAVORITE_ENTITY_DISPLAY_NAMES[favorite.entityType] || 'Desconocido',
		entityThumbnail: entityData?.thumbnail || null,
		stats: buildFavoriteStats(favorite.entityType, favorite.addedAt),
	};
}

function favoriteMatchesSearch(favorite: FavoriteWithStats, rawSearch: string): boolean {
	const search = rawSearch.trim().toLowerCase();
	if (!search) {
		return true;
	}

	return [favorite.entityName, favorite.entityId, favorite.entityType, favorite.stats.entityTypeName]
		.filter(Boolean)
		.some((value) => value.toLowerCase().includes(search));
}

/**
 * Servicio para gestionar los favoritos
 */
export const favoriteService = {
	/**
	 * Obtener IDs de entidades favoritas para el perfil activo.
	 * Si no hay perfil activo, retorna null para permitir fallback transicional.
	 */
	async getFavoriteEntityIds(entityType: FavoriteEntityType): Promise<string[] | null> {
		await validateFavoriteProfileScopeSchema();
		const profileId = await getActiveProfileIdOrNull();

		if (!profileId) {
			return null;
		}

		const result = await db
			.select({ entityId: favorites.entityId })
			.from(favorites)
			.where(and(eq(favorites.profileId, profileId), eq(favorites.entityType, entityType)))
			.orderBy(desc(favorites.addedAt));

		return result.map((row: { entityId: string }) => row.entityId);
	},

	/**
	 * Obtener IDs favoritos para el perímetro canónico usando un set vacío cuando no hay perfil activo.
	 * Esto permite proyectar `isFavorite` sin volver a caer al flag embebido.
	 */
	async getFavoriteEntityIdsOrEmpty(entityType: FavoriteEntityType): Promise<string[]> {
		ensureCanonicalFavoriteEntityType(entityType);

		const favoriteEntityIds = await favoriteService.getFavoriteEntityIds(entityType);
		return favoriteEntityIds ?? [];
	},

	/**
	 * Obtener IDs favoritos del perfil activo para un tipo canónico.
	 * Falla si no existe perfil activo.
	 */
	async getFavoriteEntityIdsOrThrow(entityType: FavoriteEntityType): Promise<string[]> {
		ensureCanonicalFavoriteEntityType(entityType);
		await validateFavoriteProfileScopeSchema();
		const profileId = await requireActiveProfileId();

		const result = await db
			.select({ entityId: favorites.entityId })
			.from(favorites)
			.where(and(eq(favorites.profileId, profileId), eq(favorites.entityType, entityType)))
			.orderBy(desc(favorites.addedAt));

		return result.map((row: { entityId: string }) => row.entityId);
	},

	applyFavoriteProjection<TEntity extends FavoriteProjectionCapableEntity>(
		entity: TEntity,
		favoriteEntityIds: readonly string[] | ReadonlySet<string>
	): TEntity & { isFavorite: boolean } {
		return applyFavoriteProjection(entity, favoriteEntityIds);
	},

	applyFavoriteProjectionMany<TEntity extends FavoriteProjectionCapableEntity>(
		entities: TEntity[],
		favoriteEntityIds: readonly string[] | ReadonlySet<string>
	): Array<TEntity & { isFavorite: boolean }> {
		return applyFavoriteProjectionMany(entities, favoriteEntityIds);
	},

	async projectEntity<TEntity extends FavoriteProjectionCapableEntity>(
		entityType: FavoriteEntityType,
		entity: TEntity
	): Promise<TEntity & { isFavorite: boolean }> {
		const favoriteEntityIds = await favoriteService.getFavoriteEntityIdsOrEmpty(entityType);
		return applyFavoriteProjection(entity, favoriteEntityIds);
	},

	async projectEntities<TEntity extends FavoriteProjectionCapableEntity>(
		entityType: FavoriteEntityType,
		entities: TEntity[]
	): Promise<Array<TEntity & { isFavorite: boolean }>> {
		if (entities.length === 0) {
			return [];
		}

		const favoriteEntityIds = await favoriteService.getFavoriteEntityIdsOrEmpty(entityType);
		return applyFavoriteProjectionMany(entities, favoriteEntityIds);
	},

	async projectEntityWithLegacyFallback<TEntity extends FavoriteProjectionCapableEntity>(
		entityType: FavoriteEntityType,
		entity: TEntity
	): Promise<TEntity & { isFavorite: boolean }> {
		const favoriteEntityIds = await favoriteService.getFavoriteEntityIds(entityType);
		return favoriteEntityIds === null
			? { ...entity, isFavorite: Boolean(entity.isFavorite) }
			: applyFavoriteProjection(entity, favoriteEntityIds);
	},

	async projectEntitiesWithLegacyFallback<TEntity extends FavoriteProjectionCapableEntity>(
		entityType: FavoriteEntityType,
		entities: TEntity[]
	): Promise<Array<TEntity & { isFavorite: boolean }>> {
		if (entities.length === 0) return [];
		const favoriteEntityIds = await favoriteService.getFavoriteEntityIds(entityType);
		return favoriteEntityIds === null
			? entities.map((entity) => ({ ...entity, isFavorite: Boolean(entity.isFavorite) }))
			: applyFavoriteProjectionMany(entities, favoriteEntityIds);
	},

	/**
	 * Establecer de forma explícita el estado favorito de una entidad.
	 */
	async set(
		entityType: FavoriteEntityType,
		entityId: string,
		isFavorite: boolean
	): Promise<{ isFavorite: boolean; id?: string }> {
		try {
			await validateFavoriteProfileScopeSchema();
			const profileId = await requireActiveProfileId();
			await ensureFavoriteTargetExists(entityType, entityId);

			const existing = await getExistingFavoriteRecord(profileId, entityType, entityId);

			if (isFavorite) {
				if (existing) {
					await updateEntityIsFavorite(entityType, entityId, true);
					return { isFavorite: true, id: existing.id };
				}

				const created = await favoriteService.toggle(entityType, entityId);
				return created;
			}

			if (!existing) {
				await updateEntityIsFavorite(entityType, entityId, false);
				return { isFavorite: false };
			}

			await db.delete(favorites).where(eq(favorites.id, existing.id));
			await updateEntityIsFavorite(entityType, entityId, false);

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.FAVORITE_TOGGLED],
				data: { action: 'removed', profileId, entityType, entityId },
			});

			favoriteLogger.info('Favorito eliminado por set explícito:', { profileId, entityType, entityId });
			return { isFavorite: false };
		} catch (error) {
			favoriteLogger.error('Error al establecer favorito:', error);
			throw error instanceof Error ? error : new Error('Error al establecer favorito');
		}
	},

	/**
	 * Alternar el estado de favorito de una entidad
	 */
	async toggle(entityType: FavoriteEntityType, entityId: string): Promise<{ isFavorite: boolean; id?: string }> {
		try {
			await validateFavoriteProfileScopeSchema();
			const profileId = await requireActiveProfileId();
			await ensureFavoriteTargetExists(entityType, entityId);

			favoriteLogger.info('Alternando favorito:', { profileId, entityType, entityId });

			// Verificar si ya existe
			const existing = await db
				.select()
				.from(favorites)
				.where(
					and(
						eq(favorites.profileId, profileId),
						eq(favorites.entityType, entityType),
						eq(favorites.entityId, entityId)
					)
				)
				.limit(1);

			if (existing.length > 0) {
				// Eliminar favorito existente
				await db.delete(favorites).where(eq(favorites.id, existing[0].id));

				// También actualizar isFavorite en la entidad si existe el campo
				await updateEntityIsFavorite(entityType, entityId, false);

				await emit({
					type: EVENT_TYPE_MAPPING[EVENTS.FAVORITE_TOGGLED],
					data: { action: 'removed', profileId, entityType, entityId },
				});

				favoriteLogger.info('Favorito eliminado:', { profileId, entityType, entityId });
				return { isFavorite: false };
			}

			// Crear nuevo favorito
			const id = crypto.randomUUID();
			await db.insert(favorites).values({
				id,
				profileId,
				entityType,
				entityId,
				addedAt: new Date(),
			});

			// También actualizar isFavorite en la entidad si existe el campo
			await updateEntityIsFavorite(entityType, entityId, true);

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.FAVORITE_TOGGLED],
				data: { action: 'added', profileId, entityType, entityId, id },
			});

			favoriteLogger.info('Favorito añadido:', { profileId, entityType, entityId, id });
			return { isFavorite: true, id };
		} catch (error) {
			favoriteLogger.error('Error al alternar favorito:', error);
			throw error instanceof Error ? error : new Error('Error al alternar favorito');
		}
	},

	/**
	 * Establecer en lote el estado favorito explícito de varias entidades del mismo tipo.
	 */
	async setMany(entityType: FavoriteEntityType, entityIds: string[], isFavorite: boolean): Promise<number> {
		try {
			await validateFavoriteProfileScopeSchema();
			const profileId = await requireActiveProfileId();
			const uniqueEntityIds = await ensureFavoriteTargetsExist(entityType, entityIds);

			if (uniqueEntityIds.length === 0) {
				return 0;
			}

			const existing = await db
				.select({
					id: favorites.id,
					entityId: favorites.entityId,
				})
				.from(favorites)
				.where(
					and(
						eq(favorites.profileId, profileId),
						eq(favorites.entityType, entityType),
						inArray(favorites.entityId, uniqueEntityIds)
					)
				);

			const existingByEntityId = new Map(
				existing.map((favorite: { entityId: string; id: string }) => [favorite.entityId, favorite.id])
			);

			if (isFavorite) {
				const idsToCreate = uniqueEntityIds.filter((entityId) => !existingByEntityId.has(entityId));

				if (idsToCreate.length > 0) {
					await db.insert(favorites).values(
						idsToCreate.map((entityId) => ({
							id: crypto.randomUUID(),
							profileId,
							entityType,
							entityId,
							addedAt: new Date(),
						}))
					);
				}
			} else {
				const favoriteIdsToDelete = existing.map((favorite: { id: string }) => favorite.id);

				if (favoriteIdsToDelete.length > 0) {
					await db.delete(favorites).where(inArray(favorites.id, favoriteIdsToDelete));
				}
			}

			await updateEntityIsFavoriteMany(entityType, uniqueEntityIds, isFavorite);

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.FAVORITES_CHANGED],
				data: {
					action: isFavorite ? 'batch-added' : 'batch-removed',
					profileId,
					entityType,
					entityIds: uniqueEntityIds,
					count: uniqueEntityIds.length,
				},
			});

			favoriteLogger.info('Favoritos actualizados en lote:', {
				profileId,
				entityType,
				isFavorite,
				count: uniqueEntityIds.length,
			});

			return uniqueEntityIds.length;
		} catch (error) {
			favoriteLogger.error('Error al establecer favoritos en lote:', error);
			throw error instanceof Error ? error : new Error('Error al establecer favoritos en lote');
		}
	},

	/**
	 * Verificar si una entidad es favorita
	 */
	async isFavorite(entityType: FavoriteEntityType, entityId: string): Promise<boolean> {
		await validateFavoriteProfileScopeSchema();
		const profileId = await requireActiveProfileId();

		const result = await db
			.select({ id: favorites.id })
			.from(favorites)
			.where(
				and(eq(favorites.profileId, profileId), eq(favorites.entityType, entityType), eq(favorites.entityId, entityId))
			)
			.limit(1);

		return result.length > 0;
	},

	/**
	 * Obtener todos los favoritos con filtros
	 */
	async list(filters: FavoriteFilters = {}): Promise<FavoriteResult> {
		const { entityType, limit = 50, offset = 0, search, sortBy = 'addedAt', sortOrder = 'desc' } = filters;

		try {
			if (entityType && !isCanonicalFavoriteEntityType(entityType)) {
				return { items: [], total: 0, hasMore: false };
			}

			await validateFavoriteProfileScopeSchema();
			const profileId = await requireActiveProfileId();

			const conditions = [
				eq(favorites.profileId, profileId),
				inArray(favorites.entityType, canonicalFavoriteEntityTypes),
			];
			if (entityType) {
				conditions.push(eq(favorites.entityType, entityType));
			}

			const whereClause = and(...conditions);
			const orderByClause =
				sortBy === 'entityType'
					? sortOrder === 'desc'
						? desc(favorites.entityType)
						: asc(favorites.entityType)
					: sortOrder === 'desc'
						? desc(favorites.addedAt)
						: asc(favorites.addedAt);

			if (search?.trim()) {
				const allItems = await db.select().from(favorites).where(whereClause).orderBy(orderByClause);
				const enrichedItems = await Promise.all(allItems.map((favorite: FavoriteRecord) => enrichFavorite(favorite)));
				const filteredItems = enrichedItems.filter((favorite) => favoriteMatchesSearch(favorite, search));
				const paginatedItems = filteredItems.slice(offset, offset + limit);

				return {
					items: paginatedItems,
					total: filteredItems.length,
					hasMore: offset + limit < filteredItems.length,
				};
			}

			const [items, totalResult] = await Promise.all([
				db.select().from(favorites).where(whereClause).orderBy(orderByClause).limit(limit).offset(offset),
				db.select({ count: count() }).from(favorites).where(whereClause),
			]);

			const total = totalResult[0]?.count ?? 0;

			// Enriquecer con datos de la entidad
			const enrichedItems = await Promise.all(items.map((favorite: FavoriteRecord) => enrichFavorite(favorite)));

			return {
				items: enrichedItems,
				total,
				hasMore: offset + limit < total,
			};
		} catch (error) {
			favoriteLogger.error('Error al listar favoritos:', error);
			throw error instanceof Error ? error : new Error('Error al listar favoritos');
		}
	},

	/**
	 * Obtener un favorito por ID
	 */
	async getById(id: string): Promise<FavoriteWithStats | null> {
		try {
			await validateFavoriteProfileScopeSchema();
			const profileId = await requireActiveProfileId();

			const result = await db
				.select()
				.from(favorites)
				.where(
					and(
						eq(favorites.id, id),
						eq(favorites.profileId, profileId),
						inArray(favorites.entityType, canonicalFavoriteEntityTypes)
					)
				)
				.limit(1);

			if (result.length === 0) return null;

			return enrichFavorite(result[0] as FavoriteRecord);
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
			await validateFavoriteProfileScopeSchema();
			const profileId = await requireActiveProfileId();

			const existing = await db
				.select()
				.from(favorites)
				.where(and(eq(favorites.id, id), eq(favorites.profileId, profileId)))
				.limit(1);

			if (existing.length === 0) return false;

			const fav = existing[0];
			await db.delete(favorites).where(eq(favorites.id, id));

			// Actualizar isFavorite en la entidad
			await updateEntityIsFavorite(fav.entityType as FavoriteEntityType, fav.entityId, false);

			await emit({
				type: EVENT_TYPE_MAPPING[EVENTS.FAVORITE_TOGGLED],
				data: {
					action: 'removed',
					profileId,
					entityType: fav.entityType,
					entityId: fav.entityId,
				},
			});

			return true;
		} catch (error) {
			favoriteLogger.error('Error al eliminar favorito:', error);
			return false;
		}
	},

	getEntityData,

	updateEntityIsFavorite,
	updateEntityIsFavoriteMany,

	/**
	 * Obtener conteo de favoritos por tipo
	 */
	async getCountsByType(): Promise<Record<string, number>> {
		try {
			await validateFavoriteProfileScopeSchema();
			const profileId = await requireActiveProfileId();

			const results = await db
				.select({
					entityType: favorites.entityType,
					count: count(),
				})
				.from(favorites)
				.where(and(eq(favorites.profileId, profileId), inArray(favorites.entityType, canonicalFavoriteEntityTypes)))
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
