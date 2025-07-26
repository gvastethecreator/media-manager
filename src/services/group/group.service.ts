/**
 * @file Servicio para la gestión de grupos
 * @module services/group
 */

import * as crypto from 'crypto';
import { and, asc, count, desc, eq, inArray, like, or } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { groupAlbums, groupImages, groups, groupTags, groupVideos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { emit } from '@/lib/server/events.server';
import { STATS_EVENTS, statsEventEmitter } from '@/services/stats';
import type {
	GroupCreateInput,
	GroupRelations,
	GroupSearchResult,
	GroupUpdateInput,
	GroupWithStats,
} from '@/types/entities/group/types';

// Logger específico para el servicio de grupos
const logger = serverLogger.withContext('GroupService');

// Códigos de error
export enum GroupErrorCode {
	NOT_FOUND = 'GROUP_NOT_FOUND',
	ALREADY_EXISTS = 'GROUP_ALREADY_EXISTS',
	INVALID_DATA = 'GROUP_INVALID_DATA',
	OPERATION_FAILED = 'GROUP_OPERATION_FAILED',
	PERMISSION_DENIED = 'GROUP_PERMISSION_DENIED',
}

// Constructor de errores para grupos
export const createGroupError = (
	message: string,
	code: GroupErrorCode = GroupErrorCode.OPERATION_FAILED,
	cause?: unknown
) => {
	const error = new Error(message);
	error.name = 'GroupServiceError';
	Object.assign(error, { code, cause });
	return error;
};

// Eventos del servicio
export const GROUP_EVENTS = {
	CREATED: 'group:created',
	UPDATED: 'group:updated',
	DELETED: 'group:deleted',
	ITEMS_ADDED: 'group:items:added',
	ITEMS_REMOVED: 'group:items:removed',
	STATS_UPDATED: 'group:stats:updated',
} as const;

// Notificación de cambios en grupos
export const notifyGroupChange = async (
	action: 'create' | 'update' | 'delete' | 'items:add' | 'items:remove',
	group: GroupWithStats | { id: string }
) => {
	// Usar EventType válido del sistema central
	const eventType = 'update'; // Tipo válido para grupos según EventType

	// Emitir evento
	await emit({
		type: eventType,
		data: { action, group },
	});

	// Notificar a estadísticas
	statsEventEmitter.emit(STATS_EVENTS.GROUP_CHANGE);

	logger.info(`🔔 Notificado cambio en grupo: ${action}`, { groupId: group.id });
};

/**
 * Obtiene un grupo por su ID con estadísticas
 */
export const getGroupService = async (id: string): Promise<GroupWithStats | null> => {
	try {
		logger.info(`🔍 Buscando grupo con ID: ${id}`);

		// Buscar grupo base
		const groupResult = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

		if (groupResult.length === 0) {
			logger.warn(`⚠️ Grupo no encontrado: ${id}`);
			return null;
		}

		const group = groupResult[0];

		// Construir grupo con estadísticas
		const groupWithStats: GroupWithStats = {
			...group,
		};

		logger.info(`✅ Grupo encontrado: ${group.name}`);
		return groupWithStats;
	} catch (error) {
		logger.error('❌ Error al obtener grupo por ID', { error, groupId: id });
		throw createGroupError(
			`Error al obtener grupo: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Obtiene múltiples grupos por sus IDs
 */
export const getGroupsByIdsService = async (ids: string[]): Promise<GroupWithStats[]> => {
	try {
		logger.info(`🔍 Buscando grupos por IDs, cantidad: ${ids.length}`);

		if (ids.length === 0) {
			return [];
		}

		// Buscar grupos base
		const groupsResult = await db.select().from(groups).where(inArray(groups.id, ids));

		// Obtener estadísticas para cada grupo
		const groupsWithStats = await Promise.all(
			groupsResult.map(async (group) => {
				const [imageCount, videoCount, albumCount, tagCount] = await Promise.all([
					db
						.select({ count: count() })
						.from(groupImages)
						.where(eq(groupImages.groupId, group.id))
						.then((res) => res[0]?.count || 0),
					db
						.select({ count: count() })
						.from(groupVideos)
						.where(eq(groupVideos.groupId, group.id))
						.then((res) => res[0]?.count || 0),
					db
						.select({ count: count() })
						.from(groupAlbums)
						.where(eq(groupAlbums.groupId, group.id))
						.then((res) => res[0]?.count || 0),
					db
						.select({ count: count() })
						.from(groupTags)
						.where(eq(groupTags.groupId, group.id))
						.then((res) => res[0]?.count || 0),
				]);

				return {
					...group,
					_count: {
						images: imageCount,
						videos: videoCount,
						albums: albumCount,
						tags: tagCount,
						collections: 0,
						characters: 0,
						places: 0,
						worldItems: 0,
						concepts: 0,
						prompts: 0,
						notes: 0,
						wildcards: 0,
						properties: 0,
						groups: 0,
					},
				} as GroupWithStats;
			})
		);

		logger.info(`✅ Grupos encontrados: ${groupsWithStats.length}`);
		return groupsWithStats;
	} catch (error) {
		logger.error('❌ Error al obtener grupos por IDs', { error, ids });
		throw createGroupError(
			`Error al obtener grupos: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Busca grupos según criterios específicos
 */
export const searchGroupsService = async (
	filters: Record<string, any> = {},
	options: {
		page?: number;
		pageSize?: number;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
		includeInactive?: boolean;
	} = {}
): Promise<GroupSearchResult> => {
	try {
		logger.info('🔍 Buscando grupos con filtros');

		// Configurar paginación
		const page = options.page || 1;
		const pageSize = options.pageSize || 20;
		const offset = (page - 1) * pageSize;

		// Construir condiciones WHERE
		const conditions = [];

		if (filters.search) {
			conditions.push(or(like(groups.name, `%${filters.search}%`), like(groups.description, `%${filters.search}%`)));
		}

		if (filters.isFavorite !== undefined) {
			conditions.push(eq(groups.isFavorite, filters.isFavorite));
		}

		if (filters.category) {
			conditions.push(eq(groups.category, filters.category));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Configurar orden
		const sortBy = options.sortBy || 'name';
		const sortOrder = options.sortOrder || 'asc';
		const orderByClause =
			sortOrder === 'desc'
				? desc(groups[sortBy as keyof typeof groups] as any)
				: asc(groups[sortBy as keyof typeof groups] as any);

		// Ejecutar consultas en paralelo
		const [groupsResult, totalCount] = await Promise.all([
			db.select().from(groups).where(whereClause).orderBy(orderByClause).limit(pageSize).offset(offset),
			db
				.select({ count: count() })
				.from(groups)
				.where(whereClause)
				.then((res) => res[0]?.count || 0),
		]);

		// Obtener estadísticas para cada grupo
		const groupsWithStats = await Promise.all(
			groupsResult.map(async (group) => {
				const [imageCount, videoCount, albumCount, tagCount] = await Promise.all([
					db
						.select({ count: count() })
						.from(groupImages)
						.where(eq(groupImages.groupId, group.id))
						.then((res) => res[0]?.count || 0),
					db
						.select({ count: count() })
						.from(groupVideos)
						.where(eq(groupVideos.groupId, group.id))
						.then((res) => res[0]?.count || 0),
					db
						.select({ count: count() })
						.from(groupAlbums)
						.where(eq(groupAlbums.groupId, group.id))
						.then((res) => res[0]?.count || 0),
					db
						.select({ count: count() })
						.from(groupTags)
						.where(eq(groupTags.groupId, group.id))
						.then((res) => res[0]?.count || 0),
				]);

				return {
					...group,
					_count: {
						images: imageCount,
						videos: videoCount,
						albums: albumCount,
						tags: tagCount,
						collections: 0,
						characters: 0,
						places: 0,
						worldItems: 0,
						concepts: 0,
						prompts: 0,
						notes: 0,
						wildcards: 0,
						properties: 0,
						groups: 0,
					},
				} as GroupWithStats;
			})
		);

		const result: GroupSearchResult = {
			data: groupsWithStats,
			total: totalCount,
			page,
			pageSize,
			totalPages: Math.ceil(totalCount / pageSize),
			hasNext: page * pageSize < totalCount,
			hasPrevious: page > 1,
		};

		logger.info(`✅ Búsqueda completada, encontrados ${result.total} grupos`);
		return result;
	} catch (error) {
		logger.error('❌ Error al buscar grupos', { error, filters, options });
		throw createGroupError(
			`Error al buscar grupos: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Crea un nuevo grupo
 */
export const createGroupService = async (data: GroupCreateInput): Promise<GroupWithStats> => {
	try {
		logger.info('✨ Creando nuevo grupo', { name: data.name });

		// Verificar si ya existe un grupo con el mismo nombre
		if (data.name) {
			const existingGroup = await db.select().from(groups).where(eq(groups.name, data.name)).limit(1);
			if (existingGroup.length > 0) {
				throw createGroupError(`Ya existe un grupo con el nombre "${data.name}"`, GroupErrorCode.ALREADY_EXISTS);
			}
		}

		// Crear grupo usando Drizzle
		const newGroup = await db
			.insert(groups)
			.values({
				id: crypto.randomUUID(),
				name: data.name,
				description: data.description,
				isFavorite: data.isFavorite || false,
				category: data.category,
				filters: data.filters || '[]',
				isActive: data.isActive !== false, // true por defecto
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		// Construir grupo con estadísticas
		const groupWithStats: GroupWithStats = {
			...newGroup[0],
			_count: {
				images: 0,
				videos: 0,
				albums: 0,
				tags: 0,
				collections: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		// Notificar creación
		await notifyGroupChange('create', groupWithStats);
		logger.info(`✅ Grupo creado: ${groupWithStats.name}`, { groupId: groupWithStats.id });
		return groupWithStats;
	} catch (error) {
		logger.error('❌ Error al crear grupo', { error, data });

		if (error instanceof Error && error.name === 'GroupServiceError') {
			throw error;
		}

		throw createGroupError(
			`Error al crear grupo: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Actualiza un grupo existente
 */
export const updateGroupService = async (id: string, data: GroupUpdateInput): Promise<GroupWithStats> => {
	try {
		logger.info(`📝 Actualizando grupo: ${id}`);

		// Verificar que el grupo existe
		const existingGroup = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

		if (existingGroup.length === 0) {
			throw createGroupError(`No se encontró el grupo con ID: ${id}`, GroupErrorCode.NOT_FOUND);
		}

		// Verificar nombre único si se está actualizando
		if (data.name && data.name !== existingGroup[0].name) {
			const groupWithSameName = await db
				.select()
				.from(groups)
				.where(and(eq(groups.name, data.name), eq(groups.id, id)))
				.limit(1);

			if (groupWithSameName.length > 0) {
				throw createGroupError(`Ya existe un grupo con el nombre "${data.name}"`, GroupErrorCode.ALREADY_EXISTS);
			}
		}

		// Preparar datos de actualización
		const updateData: any = {
			updatedAt: new Date(),
		};

		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
		if (data.category !== undefined) updateData.category = data.category;
		if (data.filters !== undefined) updateData.filters = data.filters;
		if (data.isActive !== undefined) updateData.isActive = data.isActive;

		// Actualizar grupo usando Drizzle
		const updatedGroup = await db.update(groups).set(updateData).where(eq(groups.id, id)).returning();

		// Obtener estadísticas actualizadas
		const [imageCount, videoCount, albumCount, tagCount] = await Promise.all([
			db
				.select({ count: count() })
				.from(groupImages)
				.where(eq(groupImages.groupId, id))
				.then((res) => res[0]?.count || 0),
			db
				.select({ count: count() })
				.from(groupVideos)
				.where(eq(groupVideos.groupId, id))
				.then((res) => res[0]?.count || 0),
			db
				.select({ count: count() })
				.from(groupAlbums)
				.where(eq(groupAlbums.groupId, id))
				.then((res) => res[0]?.count || 0),
			db
				.select({ count: count() })
				.from(groupTags)
				.where(eq(groupTags.groupId, id))
				.then((res) => res[0]?.count || 0),
		]);

		const groupWithStats: GroupWithStats = {
			...updatedGroup[0],
			_count: {
				images: imageCount,
				videos: videoCount,
				albums: albumCount,
				tags: tagCount,
				collections: 0,
				characters: 0,
				places: 0,
				worldItems: 0,
				concepts: 0,
				prompts: 0,
				notes: 0,
				wildcards: 0,
				properties: 0,
				groups: 0,
			},
		};

		// Notificar actualización
		await notifyGroupChange('update', groupWithStats);

		logger.info(`✅ Grupo actualizado: ${groupWithStats.name}`, { groupId: groupWithStats.id });
		return groupWithStats;
	} catch (error) {
		logger.error('❌ Error al actualizar grupo', { error, groupId: id, data });

		if (error instanceof Error && error.name === 'GroupServiceError') {
			throw error;
		}

		throw createGroupError(
			`Error al actualizar grupo: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Elimina un grupo
 */
export const deleteGroupService = async (id: string): Promise<void> => {
	try {
		logger.info(`🗑️ Eliminando grupo: ${id}`);

		// Verificar que el grupo existe
		const existingGroup = await db.select().from(groups).where(eq(groups.id, id)).limit(1);

		if (existingGroup.length === 0) {
			throw createGroupError(`No se encontró el grupo con ID: ${id}`, GroupErrorCode.NOT_FOUND);
		}

		// Notificar antes de eliminar
		await notifyGroupChange('delete', { id });

		// Eliminar usando Drizzle
		await db.delete(groups).where(eq(groups.id, id));

		logger.info(`✅ Grupo eliminado: ${id}`);
	} catch (error) {
		logger.error('❌ Error al eliminar grupo', { error, groupId: id });

		if (error instanceof Error && error.name === 'GroupServiceError') {
			throw error;
		}

		throw createGroupError(
			`Error al eliminar grupo: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Obtiene estadísticas de un grupo
 */
export const getGroupStatsService = async (id: string): Promise<GroupWithStats | null> => {
	try {
		logger.info(`📊 Obteniendo estadísticas del grupo: ${id}`);

		// Reutilizar la lógica de getGroupService que ya está migrada
		const group = await getGroupService(id);

		if (!group) {
			throw createGroupError(`No se encontró el grupo con ID: ${id}`, GroupErrorCode.NOT_FOUND);
		}

		logger.info(`✅ Estadísticas obtenidas para grupo: ${id}`);
		return group;
	} catch (error) {
		logger.error('❌ Error al obtener estadísticas del grupo', { error, groupId: id });
		if (error instanceof Error && error.name === 'GroupServiceError') {
			throw error;
		}
		throw createGroupError(
			`Error al obtener estadísticas: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Añade un elemento a un grupo
 */
export const addItemToGroupService = async (
	groupId: string,
	itemId: string,
	itemType: keyof GroupRelations
): Promise<void> => {
	try {
		logger.info('➕ Añadiendo elemento a grupo', { groupId, itemId, itemType });

		// Verificar que el grupo existe
		const existingGroup = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);

		if (existingGroup.length === 0) {
			throw createGroupError(`No se encontró el grupo con ID: ${groupId}`, GroupErrorCode.NOT_FOUND);
		}

		// Validar y crear la relación según el tipo usando Drizzle
		switch (itemType) {
			case 'images':
				await db.insert(groupImages).values({ groupId, imageId: itemId });
				break;
			case 'videos':
				await db.insert(groupVideos).values({ groupId, videoId: itemId });
				break;
			case 'albums':
				await db.insert(groupAlbums).values({ groupId, albumId: itemId });
				break;
			case 'tags':
				await db.insert(groupTags).values({ groupId, tagId: itemId });
				break;
			default:
				throw createGroupError(`Tipo de elemento no soportado: ${itemType}`, GroupErrorCode.INVALID_DATA);
		}

		// Notificar cambio
		await notifyGroupChange('items:add', { id: groupId });

		logger.info('✅ Elemento añadido al grupo', { groupId, itemId, itemType });
	} catch (error) {
		logger.error('❌ Error al añadir elemento al grupo', { error, groupId, itemId, itemType });

		if (error instanceof Error && error.name === 'GroupServiceError') {
			throw error;
		}

		throw createGroupError(
			`Error al añadir elemento: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

/**
 * Elimina un elemento de un grupo
 */
export const removeItemFromGroupService = async (
	groupId: string,
	itemId: string,
	itemType: keyof GroupRelations
): Promise<void> => {
	try {
		logger.info('➖ Eliminando elemento del grupo', { groupId, itemId, itemType });

		// Verificar que el grupo existe
		const existingGroup = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);

		if (existingGroup.length === 0) {
			throw createGroupError(`No se encontró el grupo con ID: ${groupId}`, GroupErrorCode.NOT_FOUND);
		}

		// Validar y eliminar la relación según el tipo usando Drizzle
		switch (itemType) {
			case 'images':
				await db.delete(groupImages).where(and(eq(groupImages.groupId, groupId), eq(groupImages.imageId, itemId)));
				break;
			case 'videos':
				await db.delete(groupVideos).where(and(eq(groupVideos.groupId, groupId), eq(groupVideos.videoId, itemId)));
				break;
			case 'albums':
				await db.delete(groupAlbums).where(and(eq(groupAlbums.groupId, groupId), eq(groupAlbums.albumId, itemId)));
				break;
			case 'tags':
				await db.delete(groupTags).where(and(eq(groupTags.groupId, groupId), eq(groupTags.tagId, itemId)));
				break;
			default:
				throw createGroupError(`Tipo de elemento no soportado: ${itemType}`, GroupErrorCode.INVALID_DATA);
		}

		// Notificar cambio
		await notifyGroupChange('items:remove', { id: groupId });

		logger.info('✅ Elemento eliminado del grupo', { groupId, itemId, itemType });
	} catch (error) {
		logger.error('❌ Error al eliminar elemento del grupo', { error, groupId, itemId, itemType });

		if (error instanceof Error && error.name === 'GroupServiceError') {
			throw error;
		}

		throw createGroupError(
			`Error al eliminar elemento: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
};

// Exportación de objetos agrupados para una interfaz más limpia
export const groupService = {
	// Operaciones principales
	get: getGroupService,
	getMany: getGroupsByIdsService,
	create: createGroupService,
	update: updateGroupService,
	delete: deleteGroupService,
	search: searchGroupsService,
	// Operaciones con elementos
	addItem: addItemToGroupService,
	removeItem: removeItemFromGroupService,
	// Operaciones adicionales
	getStats: getGroupStatsService,
	getRecentMedia: getRecentGroupMediaService,
	getCardData: getGroupCardDataService,
};

// Permitir el uso como importación predeterminada para mayor flexibilidad
export default groupService;

/**
 * Obtiene las imágenes y videos recientes de un grupo para mostrar en la tarjeta
 */
export async function getRecentGroupMediaService(groupId: string, limit = 6) {
	try {
		// Cargar imágenes recientes
		const recentImages = await db
			.select()
			.from(groupImages)
			.where(eq(groupImages.groupId, groupId))
			.limit(Math.ceil(limit / 2));

		// Cargar videos recientes
		const recentVideos = await db
			.select()
			.from(groupVideos)
			.where(eq(groupVideos.groupId, groupId))
			.limit(Math.floor(limit / 2));

		// Combinar y formatear los resultados
		const imageResults = recentImages.map((img: typeof recentImages[0]) => ({
			id: img.imageId,
			name: `Image ${img.imageId}`,
			thumbnailUrl: `/api/images/${img.imageId}/thumbnail`,
			url: `/api/images/${img.imageId}/content`,
			isVideo: false,
		}));

		const videoResults = recentVideos.map((video: typeof recentVideos[0]) => ({
			id: video.videoId,
			name: `Video ${video.videoId}`,
			thumbnailUrl: `/api/videos/${video.videoId}/thumbnail`,
			url: `/api/videos/${video.videoId}/content`,
			isVideo: true,
		}));

		// Combinar y ordenar por ID (como proxy de fecha)
		return [...imageResults, ...videoResults].sort((a, b) => (a.id > b.id ? -1 : 1)).slice(0, limit);
	} catch (error) {
		logger.error('Error al obtener medios recientes del grupo', { error, groupId });
		throw createGroupError(
			`Error al obtener medios recientes: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Obtiene los datos de un grupo para mostrar en una tarjeta
 */
export async function getGroupCardDataService(groupId: string) {
	try {
		const group = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);

		if (group.length === 0) {
			throw createGroupError(`Grupo no encontrado: ${groupId}`, GroupErrorCode.NOT_FOUND);
		}

		const groupData = group[0];

		// Obtener imágenes y videos recientes
		const recentMedia = await getRecentGroupMediaService(groupData.id, 6);
		const recentImagePaths = recentMedia.filter((media: typeof recentMedia[0]) => !media.isVideo).map((media: typeof recentMedia[0]) => media.thumbnailUrl);
		const recentVideoPaths = recentMedia.filter((media: typeof recentMedia[0]) => media.isVideo).map((media: typeof recentMedia[0]) => media.thumbnailUrl);

		// Contar entidades relacionadas (usando Drizzle)
		const [
			imageCount,
			videoCount,
			albumCount,
			collectionCount,
			tagCount,
			characterCount,
			placeCount,
			worldItemCount,
			conceptCount,
			promptCount,
			noteCount,
			wildcardCount,
			propertyCount,
		] = await Promise.all([
			db
				.select({ count: count() })
				.from(groupImages)
				.where(eq(groupImages.groupId, groupId))
				.then((res) => res[0].count),
			db
				.select({ count: count() })
				.from(groupVideos)
				.where(eq(groupVideos.groupId, groupId))
				.then((res) => res[0].count),
			db
				.select({ count: count() })
				.from(groupAlbums)
				.where(eq(groupAlbums.groupId, groupId))
				.then((res) => res[0].count),
			db
				.select({ count: count() })
				.from(groupTags)
				.where(eq(groupTags.groupId, groupId))
				.then((res) => res[0].count),
			// TODO: Add counts for other relations if they exist in Drizzle schema
			Promise.resolve(0), // Placeholder for collections
			Promise.resolve(0), // Placeholder for characters
			Promise.resolve(0), // Placeholder for places
			Promise.resolve(0), // Placeholder for worldItems
			Promise.resolve(0), // Placeholder for concepts
			Promise.resolve(0), // Placeholder for prompts
			Promise.resolve(0), // Placeholder for notes
			Promise.resolve(0), // Placeholder for wildcards
			Promise.resolve(0), // Placeholder for properties
		]);

		const counts = {
			images: imageCount,
			videos: videoCount,
			albums: albumCount,
			collections: collectionCount,
			tags: tagCount,
			characters: characterCount,
			places: placeCount,
			worldItems: worldItemCount,
			concepts: conceptCount,
			prompts: promptCount,
			notes: noteCount,
			wildcards: wildcardCount,
			properties: propertyCount,
		};

		// Intentar parsear el campo filters si existe
		let filters = [];
		if (typeof groupData.filters === 'string' && groupData.filters !== 'empty_array') {
			try {
				filters = JSON.parse(groupData.filters);
			} catch (e) {
				console.error('Error parsing group filters:', e);
			}
		}

		// Calcular metadatos TCG
		const totalEntities =
			counts.images +
			counts.videos +
			counts.albums +
			counts.collections +
			counts.tags +
			counts.characters +
			counts.places +
			counts.worldItems +
			counts.concepts +
			counts.prompts +
			counts.notes +
			counts.wildcards +
			counts.properties;

		// Determinar nivel de rareza basado en el número de entidades y filtros
		const rarityLevel = calculateRarityLevel(totalEntities, filters.length);

		// Calcular puntos de poder
		const power = calculateGroupPower(groupData, totalEntities, filters.length);

		// Calcular puntos de salud basados en la diversidad de entidades
		const hp = calculateHealth(counts);

		// Calcular puntos de maná (MP) basados en filtros y flexibilidad
		const mp = calculateMana(filters.length, groupData.category);

		// Calcular nivel de organización
		const organizationLevel = calculateOrganizationLevel(counts);

		// Calcular puntaje de flexibilidad
		const flexibilityScore = calculateFlexibilityScore(filters);

		// Determinar tipo de organización
		const organizationType = determineOrganizationType(counts);

		return {
			...groupData,
			recentImages: recentImagePaths,
			recentVideos: recentVideoPaths,
			filters,
			power,
			rarityLevel,
			hp,
			mp,
			organizationLevel,
			flexibilityScore,
			organizationType,
			cardId: `G-${groupData.id.substring(0, 8)}`,
		};
	} catch (error) {
		logger.error('Error al obtener datos de la tarjeta del grupo', { error, groupId });
		throw createGroupError(
			`Error al obtener datos de la tarjeta: ${error instanceof Error ? error.message : String(error)}`,
			GroupErrorCode.OPERATION_FAILED,
			error
		);
	}
}

/**
 * Calcula el nivel de rareza del grupo basado en su contenido
 */
function calculateRarityLevel(totalEntities: number, filtersCount: number): number {
	// Base: 1-10, donde 10 es lo más raro
	let rarityScore = 1;

	// Factores que aumentan rareza:
	// 1. Gran cantidad de entidades
	if (totalEntities > 100) rarityScore += 3;
	else if (totalEntities > 50) rarityScore += 2;
	else if (totalEntities > 20) rarityScore += 1;

	// 2. Filtros complejos
	rarityScore += Math.min(3, Math.floor(filtersCount / 2));

	return Math.min(10, rarityScore);
}

/**
 * Calcula el poder de un grupo basado en sus atributos
 */
function calculateGroupPower(group: any, totalEntities: number, filtersCount: number): number {
	// Base de poder
	let power = 50;

	// Bonificación por entidades
	power += totalEntities * 2;

	// Bonificación por filtros complejos
	power += filtersCount * 10;

	// Bonificación por ser favorito
	if (group.isFavorite) power += 25;

	// Limitar el poder máximo
	return Math.min(999, power);
}

/**
 * Calcula los puntos de salud basados en la diversidad de entidades
 */
function calculateHealth(counts: any): number {
	// Base HP
	let hp = 100;

	// Validación null-safe para evitar errores de Object.entries
	if (!counts || typeof counts !== 'object') {
		console.warn('⚠️ [GROUP-SERVICE] calculateHealth recibió counts null/undefined, usando valores por defecto');
		return hp;
	}

	// Contar tipos diferentes de entidades presentes
	const entityTypes = Object.entries(counts).filter(([_, count]) => count > 0).length;

	// Bonificación por diversidad
	hp += entityTypes * 20;

	// Bonificación por volumen total de entidades principales
	const mainEntities =
		(counts.characters || 0) + (counts.places || 0) + (counts.worldItems || 0) + (counts.concepts || 0);
	hp += mainEntities * 5;

	return Math.min(999, hp);
}

/**
 * Calcula los puntos de maná (MP) basados en filtros y flexibilidad
 */
function calculateMana(filtersCount: number, category: string | null): number {
	// Base MP
	let mp = 60;

	// Bonificación por filtros (representa "opciones mágicas")
	mp += filtersCount * 15;

	// Bonificación por categoría especializada
	if (category && category !== 'general') {
		mp += 25;
	}

	return Math.min(999, mp);
}

/**
 * Calcula el nivel de organización del grupo
 */
function calculateOrganizationLevel(counts: any): number {
	// Nivel básico: 1-10
	const totalAlbumCollections = counts.albums + counts.collections;
	const totalItems = counts.images + counts.videos;

	if (totalItems === 0) return 1;

	// Relación de organización: cuántos contenedores (albums/colecciones) por item
	const ratio = totalAlbumCollections / totalItems;

	// Convertir ratio a escala 1-10
	return Math.min(10, Math.max(1, Math.round(ratio * 20) + 1));
}

/**
 * Determina el tipo de organización basado en el tipo predominante de entidades
 */
function determineOrganizationType(counts: any): string {
	const media = counts.images + counts.videos;
	const collections = counts.albums + counts.collections;
	const worldBuilding = counts.characters + counts.places + counts.worldItems + counts.concepts;
	const utility = counts.notes + counts.prompts + counts.wildcards + counts.properties;

	const max = Math.max(media, collections, worldBuilding, utility);

	if (max === media) return 'Archivo';
	if (max === collections) return 'Colección';
	if (max === worldBuilding) return 'Mundo';
	if (max === utility) return 'Utilidad';

	return 'Mixto';
}

/**
 * Calcula la flexibilidad basada en los filtros disponibles
 */
function calculateFlexibilityScore(filters: any[]): number {
	// Escala 1-10
	if (!filters.length) return 1;

	// Complejidad basada en número de filtros
	const baseScore = Math.min(10, filters.length + 1);

	return baseScore;
}
