/**
 * @file Servicio Agregado de Archivos por Carpeta
 * @module services/folder-files
 * @description Servicio unificado para obtener todos los tipos de archivos de una carpeta con paginación optimizada
 */

import { and, count, eq, inArray, like, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { audios, documents, file3Ds, folders, images, jsonFiles, videos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { createServiceError, ServiceErrorCode } from '@/lib/utils/errors/service-errors';

const logger = serverLogger.withContext('FolderFilesService');

// Tipos para el servicio agregado
export interface FolderFile {
	id: string;
	name: string;
	path: string;
	size: number;
	createdAt: Date;
	updatedAt: Date;
	folderId: string;
	entityType: 'image' | 'video' | 'audio' | 'document' | 'json' | '3d';
	extension: string;
	// Metadatos específicos por tipo (opcional)
	metadata?: Record<string, any>;
	// Thumbnail info para imágenes/videos
	thumbnailPath?: string;
	// Stats específicos
	stats?: {
		views?: number;
		downloads?: number;
		isFavorite?: boolean;
	};
}

export interface GetFolderFilesOptions {
	folderId: string;
	includeSubfolders?: boolean;
	limit?: number;
	offset?: number;
	cursor?: string; // Para cursor-based pagination
	search?: string;
	sortBy?: 'name' | 'size' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
	fileTypes?: Array<'image' | 'video' | 'audio' | 'document' | 'json' | '3d'>;
}

export interface GetFolderFilesResult {
	files: FolderFile[];
	total: number;
	hasMore: boolean;
	nextCursor?: string;
	pagination: {
		limit: number;
		offset: number;
		totalPages: number;
		currentPage: number;
	};
	performance: {
		queryTime: number;
		processedRecords: number;
	};
}

/**
 * Convierte una fila de imagen a FolderFile
 */
function mapImageToFolderFile(image: any): FolderFile {
	return {
		id: image.id,
		name: image.name,
		path: image.path,
		size: image.size || 0,
		createdAt: image.createdAt,
		updatedAt: image.updatedAt,
		folderId: image.folderId,
		entityType: 'image',
		extension: image.extension || '',
		// Generar URL de API para thumbnail (NO usar thumbnailPath que puede contener base64)
		thumbnailPath: `/api/images/${image.id}/thumbnail`,
		metadata: {
			width: image.width,
			height: image.height,
			format: image.format,
		},
		stats: {
			views: image.views || 0,
			isFavorite: image.isFavorite,
		},
	};
}

/**
 * Convierte una fila de video a FolderFile
 */
function mapVideoToFolderFile(video: any): FolderFile {
	return {
		id: video.id,
		name: video.name,
		path: video.path,
		size: video.size || 0,
		createdAt: video.createdAt,
		updatedAt: video.updatedAt,
		folderId: video.folderId,
		entityType: 'video',
		extension: video.extension || '',
		// Generar URL de API para thumbnail (NO usar thumbnailPath que puede contener base64)
		thumbnailPath: `/api/videos/${video.id}/thumbnail`,
		metadata: {
			duration: video.duration,
			width: video.width,
			height: video.height,
			codec: video.codec,
		},
		stats: {
			views: video.views || 0,
			isFavorite: video.isFavorite,
		},
	};
}

/**
 * Convierte una fila de audio a FolderFile
 */
function mapAudioToFolderFile(audio: any): FolderFile {
	return {
		id: audio.id,
		name: audio.name,
		path: audio.path,
		size: audio.size || 0,
		createdAt: audio.createdAt,
		updatedAt: audio.updatedAt,
		folderId: audio.folderId,
		entityType: 'audio',
		extension: audio.extension || '',
		metadata: {
			duration: audio.duration,
			bitrate: audio.bitrate,
			artist: audio.artist,
			album: audio.album,
		},
		stats: {
			views: audio.views || 0,
			isFavorite: audio.isFavorite,
		},
	};
}

/**
 * Convierte una fila de documento a FolderFile
 */
function mapDocumentToFolderFile(doc: any): FolderFile {
	return {
		id: doc.id,
		name: doc.name,
		path: doc.path,
		size: doc.size || 0,
		createdAt: doc.createdAt,
		updatedAt: doc.updatedAt,
		folderId: doc.folderId,
		entityType: 'document',
		extension: doc.extension || '',
		metadata: {
			pageCount: doc.pageCount,
			title: doc.title,
			author: doc.author,
		},
		stats: {
			views: doc.views || 0,
			isFavorite: doc.isFavorite,
		},
	};
}

/**
 * Convierte una fila de JSON a FolderFile
 */
function mapJsonToFolderFile(json: any): FolderFile {
	return {
		id: json.id,
		name: json.name,
		path: json.path,
		size: json.size || 0,
		createdAt: json.createdAt,
		updatedAt: json.updatedAt,
		folderId: json.folderId,
		entityType: 'json',
		extension: json.extension || '.json',
		metadata: {
			isValid: json.isValid,
			keys: json.keys,
		},
		stats: {
			views: json.views || 0,
			isFavorite: json.isFavorite,
		},
	};
}

/**
 * Convierte una fila de archivo 3D a FolderFile
 */
function mapFile3DToFolderFile(file3d: any): FolderFile {
	return {
		id: file3d.id,
		name: file3d.name,
		path: file3d.path,
		size: file3d.size || 0,
		createdAt: file3d.createdAt,
		updatedAt: file3d.updatedAt,
		folderId: file3d.folderId,
		entityType: '3d',
		extension: file3d.extension || '',
		metadata: {
			vertices: file3d.vertices,
			faces: file3d.faces,
			format: file3d.format,
		},
		stats: {
			views: file3d.views || 0,
			isFavorite: file3d.isFavorite,
		},
	};
}

/**
 * Obtiene las subcarpetas de una carpeta (para includeSubfolders)
 */
async function getSubfolderIds(folderId: string): Promise<string[]> {
	try {
		// Obtener la carpeta base para conocer su path
		const [folder] = await db.select({ path: folders.path }).from(folders).where(eq(folders.id, folderId)).limit(1);

		if (!folder) {
			return [];
		}

		// Buscar todas las subcarpetas que empiecen con el path de la carpeta base
		const subfolders = await db
			.select({ id: folders.id })
			.from(folders)
			.where(like(folders.path, `${folder.path}/%`));

		return [folderId, ...subfolders.map((sf: { id: string }) => sf.id)];
	} catch (error) {
		logger.error('Error getting subfolders:', error);
		return [folderId]; // Fallback: solo la carpeta original
	}
}

/**
 * Construye las condiciones WHERE para las consultas
 */
function buildWhereConditions(
	folderIds: string[],
	search?: string,
	table?: typeof images | typeof videos | typeof audios | typeof documents | typeof jsonFiles | typeof file3Ds
) {
	const conditions = [];

	// Filtro por carpetas
	if (table && folderIds.length === 1) {
		conditions.push(eq(table.folderId, folderIds[0]));
	} else if (table) {
		conditions.push(inArray(table.folderId, folderIds));
	}

	// Filtro de búsqueda
	if (search?.trim() && table) {
		conditions.push(like(table.name, `%${search.trim()}%`));
	}

	return and(...conditions);
}

/**
 * Obtiene archivos de una carpeta con paginación optimizada
 */
export async function getFolderFiles(options: GetFolderFilesOptions): Promise<GetFolderFilesResult> {
	const startTime = Date.now();

	const {
		folderId,
		includeSubfolders = false,
		limit = 150,
		offset = 0,
		search,
		sortBy = 'name',
		sortOrder = 'asc',
		fileTypes = ['image', 'video', 'audio', 'document', 'json', '3d'],
	} = options;

	try {
		// 1. Determinar carpetas a incluir
		const folderIds = includeSubfolders ? await getSubfolderIds(folderId) : [folderId];

		// 2. Crear consultas UNION ALL
		const unionQueries = [];

		// Imágenes
		// NOTA: No seleccionamos `thumbnail` (base64) - generamos URL desde ID en mapRowToFolderFile
		if (fileTypes.includes('image')) {
			unionQueries.push(sql`
				SELECT
					id, name, path, size, createdAt, updatedAt, folderId, 'image' as entityType,
					NULL as extension,
					NULL as thumbnail,
					metadata,
					isFavorite,
					0 as views
				FROM ${images}
				WHERE ${buildWhereConditions(folderIds, search, images)}
			`);
		}

		// Videos
		// NOTA: No seleccionamos `thumbnail` (base64) - generamos URL desde ID en mapRowToFolderFile
		if (fileTypes.includes('video')) {
			unionQueries.push(sql`
				SELECT
					id, name, path, size, createdAt, updatedAt, folderId, 'video' as entityType,
					NULL as extension,
					NULL as thumbnail,
					metadata,
					isFavorite,
					0 as views
				FROM ${videos}
				WHERE ${buildWhereConditions(folderIds, search, videos)}
			`);
		}

		// Audios
		if (fileTypes.includes('audio')) {
			unionQueries.push(sql`
				SELECT
					id, name, path, size, createdAt, updatedAt, folderId, 'audio' as entityType,
					extension,
					NULL as thumbnail,
					NULL as metadata,
					isFavorite,
					0 as views
				FROM ${audios}
				WHERE ${buildWhereConditions(folderIds, search, audios)}
			`);
		}

		// Documentos
		if (fileTypes.includes('document')) {
			unionQueries.push(sql`
				SELECT
					id, name, path, size, createdAt, updatedAt, folderId, 'document' as entityType,
					extension,
					NULL as thumbnail,
					NULL as metadata,
					isFavorite,
					0 as views
				FROM ${documents}
				WHERE ${buildWhereConditions(folderIds, search, documents)}
			`);
		}

		// JSONs
		if (fileTypes.includes('json')) {
			unionQueries.push(sql`
				SELECT
					id, name, path, size, createdAt, updatedAt, folderId, 'json' as entityType,
					extension,
					NULL as thumbnail,
					metadata,
					isFavorite,
					0 as views
				FROM ${jsonFiles}
				WHERE ${buildWhereConditions(folderIds, search, jsonFiles)}
			`);
		}

		// Archivos 3D
		if (fileTypes.includes('3d')) {
			unionQueries.push(sql`
				SELECT
					id, name, path, size, createdAt, updatedAt, folderId, '3d' as entityType,
					extension,
					NULL as thumbnail,
					NULL as metadata,
					isFavorite,
					0 as views
				FROM ${file3Ds}
				WHERE ${buildWhereConditions(folderIds, search, file3Ds)}
			`);
		}

		if (unionQueries.length === 0) {
			return {
				files: [],
				total: 0,
				hasMore: false,
				pagination: { limit, offset, totalPages: 0, currentPage: 1 },
				performance: { queryTime: 0, processedRecords: 0 },
			};
		}

		// Construir query final
		const combinedQuery = unionQueries.reduce((acc, q, i) => {
			if (i === 0) return q;
			return sql`${acc} UNION ALL ${q}`;
		}, sql``);

		// Mapeo de columnas de ordenamiento
		const sortColumn =
			sortBy === 'size'
				? sql`size`
				: sortBy === 'createdAt'
					? sql`createdAt`
					: sortBy === 'updatedAt'
						? sql`updatedAt`
						: sql`name`; // Default to name

		const finalQuery = sql`
			SELECT * FROM (${combinedQuery})
			ORDER BY ${sortColumn} ${sortOrder === 'desc' ? sql`DESC` : sql`ASC`}
			LIMIT ${limit} OFFSET ${offset}
		`;

		// Ejecutar query
		const result = await db.run(finalQuery);
		const rows = result.rows;

		// Mapear resultados
		const files = rows.map(mapRowToFolderFile);

		// 6. Calcular total (consulta separada optimizada)
		const totalCount = await getTotalFileCount(folderIds, search, fileTypes);

		const queryTime = Date.now() - startTime;
		const totalPages = Math.ceil(totalCount / limit);
		const currentPage = Math.floor(offset / limit) + 1;
		const hasMore = offset + limit < totalCount;

		logger.info(`Folder files query completed in ${queryTime}ms`, {
			folderId,
			includeSubfolders,
			folderCount: folderIds.length,
			resultCount: files.length,
			totalCount,
		});

		return {
			files,
			total: totalCount,
			hasMore,
			pagination: {
				limit,
				offset,
				totalPages,
				currentPage,
			},
			performance: {
				queryTime,
				processedRecords: files.length,
			},
		};
	} catch (error) {
		logger.error('Error in getFolderFiles:', error);
		throw createServiceError({
			code: ServiceErrorCode.UNEXPECTED_ERROR,
			message: 'Failed to get folder files',
			context: {
				folderId,
				error: error instanceof Error ? error.message : String(error),
			},
		});
	}
}

/**
 * Obtiene el total de archivos para paginación (optimizado)
 */
async function getTotalFileCount(
	folderIds: string[],
	search?: string,
	fileTypes: string[] = ['image', 'video', 'audio', 'document', 'json', '3d']
): Promise<number> {
	try {
		const countQueries: Promise<number>[] = [];

		// Construir consultas de conteo para cada tipo
		if (fileTypes.includes('image')) {
			countQueries.push(
				db
					.select({ count: count() })
					.from(images)
					.where(buildWhereConditions(folderIds, search, images))
					.then((result: Array<{ count: number }>) => result[0]?.count || 0)
			);
		}

		if (fileTypes.includes('video')) {
			countQueries.push(
				db
					.select({ count: count() })
					.from(videos)
					.where(buildWhereConditions(folderIds, search, videos))
					.then((result: Array<{ count: number }>) => result[0]?.count || 0)
			);
		}

		if (fileTypes.includes('audio')) {
			countQueries.push(
				db
					.select({ count: count() })
					.from(audios)
					.where(buildWhereConditions(folderIds, search, audios))
					.then((result: Array<{ count: number }>) => result[0]?.count || 0)
			);
		}

		if (fileTypes.includes('document')) {
			countQueries.push(
				db
					.select({ count: count() })
					.from(documents)
					.where(buildWhereConditions(folderIds, search, documents))
					.then((result: Array<{ count: number }>) => result[0]?.count || 0)
			);
		}

		if (fileTypes.includes('json')) {
			countQueries.push(
				db
					.select({ count: count() })
					.from(jsonFiles)
					.where(buildWhereConditions(folderIds, search, jsonFiles))
					.then((result: Array<{ count: number }>) => result[0]?.count || 0)
			);
		}

		if (fileTypes.includes('3d')) {
			countQueries.push(
				db
					.select({ count: count() })
					.from(file3Ds)
					.where(buildWhereConditions(folderIds, search, file3Ds))
					.then((result: Array<{ count: number }>) => result[0]?.count || 0)
			);
		}

		// Ejecutar todas las consultas de conteo en paralelo
		const counts = await Promise.all(countQueries);

		// Sumar todos los totales
		return counts.reduce((total, count) => total + count, 0);
	} catch (error) {
		logger.error('Error getting total file count:', error);
		return 0;
	}
}

/**
 * Obtiene estadísticas rápidas de una carpeta
 */
export async function getFolderFileStats(folderId: string, includeSubfolders = false) {
	try {
		const folderIds = includeSubfolders ? await getSubfolderIds(folderId) : [folderId];

		const stats = await Promise.all([
			getTotalFileCount(folderIds, undefined, ['image']),
			getTotalFileCount(folderIds, undefined, ['video']),
			getTotalFileCount(folderIds, undefined, ['audio']),
			getTotalFileCount(folderIds, undefined, ['document']),
			getTotalFileCount(folderIds, undefined, ['json']),
			getTotalFileCount(folderIds, undefined, ['3d']),
		]);

		return {
			images: stats[0],
			videos: stats[1],
			audios: stats[2],
			documents: stats[3],
			jsonFiles: stats[4],
			file3Ds: stats[5],
			total: stats.reduce((sum, count) => sum + count, 0),
		};
	} catch (error) {
		logger.error('Error getting folder file stats:', error);
		return {
			images: 0,
			videos: 0,
			audios: 0,
			documents: 0,
			jsonFiles: 0,
			file3Ds: 0,
			total: 0,
		};
	}
}

function mapRowToFolderFile(row: any): FolderFile {
	// Generar URL de thumbnail basada en entityType e id
	// NO usar row.thumbnail que contiene el contenido base64 (causaría ENAMETOOLONG)
	let thumbnailPath: string | undefined;
	if (row.entityType === 'image') {
		thumbnailPath = `/api/images/${row.id}/thumbnail`;
	} else if (row.entityType === 'video') {
		thumbnailPath = `/api/videos/${row.id}/thumbnail`;
	}
	// audios, documents, json, 3d no tienen thumbnail API por defecto

	// Parse metadata y excluir thumbnail (contiene base64 pesado)
	const rawMetadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
	const { thumbnail: _thumbnailData, ...cleanMetadata } = rawMetadata || {};

	return {
		id: row.id,
		name: row.name,
		path: row.path,
		size: Number(row.size),
		createdAt: new Date(row.createdAt),
		updatedAt: new Date(row.updatedAt),
		folderId: row.folderId,
		entityType: row.entityType,
		extension: row.extension || getExtensionFromPath(row.path),
		thumbnailPath,
		metadata: cleanMetadata,
		stats: {
			views: Number(row.views || 0),
			isFavorite: Boolean(row.isFavorite),
		},
	};
}

function getExtensionFromPath(path: string): string {
	const parts = path.split('.');
	return parts.length > 1 ? `.${parts.pop()}` : '';
}
