/**
 * @file Servicio Agregado de Archivos por Carpeta
 * @module services/folder-files
 * @description Servicio unificado para obtener todos los tipos de archivos de una carpeta con paginación optimizada
 */

import { and, count, eq, like, not, or, sql } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { audios, documents, file3Ds, folders, images, jsonFiles, videos } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { createServiceError, ServiceErrorCode } from '@/lib/utils/errors/service-errors';
import { visibleImageLifecycleCondition } from '@/services/image/image-lifecycle-query';

const logger = serverLogger.withContext('FolderFilesService');

type FileTable = typeof images | typeof videos | typeof audios | typeof documents | typeof jsonFiles | typeof file3Ds;

interface FolderQueryContext {
	childFolderPaths: string[];
	folderId: string;
	folderPath: string;
}

// Tipos para el servicio agregado
export interface FolderFile {
	createdAt: Date;
	entityType: 'image' | 'video' | 'audio' | 'document' | 'jsonFile' | 'file3d';
	extension: string;
	folderId: string;
	id: string;
	// Metadatos específicos por tipo (opcional)
	metadata?: Record<string, any>;
	name: string;
	path: string;
	size: number;
	// Stats específicos
	stats?: {
		views?: number;
		downloads?: number;
		isFavorite?: boolean;
	};
	// Thumbnail info para imágenes/videos
	thumbnailPath?: string;
	updatedAt: Date;
}

export interface GetFolderFilesOptions {
	cursor?: string; // Para cursor-based pagination
	fileTypes?: Array<'image' | 'video' | 'audio' | 'document' | 'jsonFile' | 'file3d'>;
	folderId: string;
	includeSubfolders?: boolean;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: 'name' | 'size' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
}

export interface GetFolderFilesResult {
	files: FolderFile[];
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
	total: number;
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
		entityType: 'jsonFile',
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
		entityType: 'file3d',
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
async function getFolderQueryContext(folderId: string): Promise<FolderQueryContext | null> {
	try {
		const [folder] = await db.select({ path: folders.path }).from(folders).where(eq(folders.id, folderId)).limit(1);

		if (!folder) {
			return null;
		}

		const childFolders = await db.select({ path: folders.path }).from(folders).where(eq(folders.parentId, folderId));

		return {
			folderId,
			folderPath: folder.path,
			childFolderPaths: childFolders.map((child: { path: string }) => child.path),
		};
	} catch (error) {
		logger.error('Error getting folder query context:', error);
		return null;
	}
}

function buildPathPrefixConditions(table: FileTable, folderPath: string) {
	const pathVariants = [...new Set([folderPath, folderPath.replaceAll('\\', '/'), folderPath.replaceAll('/', '\\')])];

	return pathVariants.flatMap((variant) => [like(table.path, `${variant}/%`), like(table.path, `${variant}\\%`)]);
}

/**
 * Construye las condiciones WHERE para las consultas
 */
function buildWhereConditions(
	context: FolderQueryContext,
	includeSubfolders: boolean,
	search?: string,
	table?: FileTable
) {
	const conditions = [];

	if (table) {
		const folderPathCondition = or(...buildPathPrefixConditions(table, context.folderPath));
		if (folderPathCondition) {
			conditions.push(folderPathCondition);
		}

		if (!includeSubfolders && context.childFolderPaths.length > 0) {
			const childFolderConditions = context.childFolderPaths.flatMap((childPath) =>
				buildPathPrefixConditions(table, childPath)
			);
			if (childFolderConditions.length > 0) {
				const childFoldersOrCondition = or(...childFolderConditions);
				if (childFoldersOrCondition) {
					conditions.push(not(childFoldersOrCondition));
				}
			}
		}
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
		fileTypes = ['image', 'video', 'audio', 'document', 'jsonFile', 'file3d'],
	} = options;

	try {
		const folderContext = await getFolderQueryContext(folderId);
		if (!folderContext) {
			return {
				files: [],
				total: 0,
				hasMore: false,
				pagination: { limit, offset, totalPages: 0, currentPage: 1 },
				performance: { queryTime: Date.now() - startTime, processedRecords: 0 },
			};
		}

		// 2. Crear consultas UNION ALL
		const unionQueries = [];

		// Imágenes
		// NOTA: No seleccionamos `thumbnail` (base64) - generamos URL desde ID en mapRowToFolderFile
		// OPTIMIZACIÓN: Usamos json_remove para excluir el thumbnail del metadata JSON si existe
		if (fileTypes.includes('image')) {
			unionQueries.push(sql`
				SELECT
					id, name, path, size, createdAt, updatedAt, folderId, 'image' as entityType,
					NULL as extension,
					NULL as thumbnail,
					json_remove(metadata, '$.thumbnail') as metadata,
					isFavorite,
					0 as views
				FROM ${images}
				WHERE ${and(
					buildWhereConditions(folderContext, includeSubfolders, search, images),
					visibleImageLifecycleCondition()
				)}
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
				WHERE ${buildWhereConditions(folderContext, includeSubfolders, search, videos)}
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
				WHERE ${buildWhereConditions(folderContext, includeSubfolders, search, audios)}
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
				WHERE ${buildWhereConditions(folderContext, includeSubfolders, search, documents)}
			`);
		}

		// JSONs
		if (fileTypes.includes('jsonFile')) {
			unionQueries.push(sql`
				SELECT
					id, name, path, size, createdAt, updatedAt, folderId, 'jsonFile' as entityType,
					extension,
					NULL as thumbnail,
					NULL as metadata,
					isFavorite,
					0 as views
				FROM ${jsonFiles}
				WHERE ${buildWhereConditions(folderContext, includeSubfolders, search, jsonFiles)}
			`);
		}

		// Archivos 3D
		if (fileTypes.includes('file3d')) {
			unionQueries.push(sql`
				SELECT
					id, name, path, size, createdAt, updatedAt, folderId, 'file3d' as entityType,
					extension,
					NULL as thumbnail,
					NULL as metadata,
					isFavorite,
					0 as views
				FROM ${file3Ds}
				WHERE ${buildWhereConditions(folderContext, includeSubfolders, search, file3Ds)}
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
		const combinedQuery = unionQueries.reduce(
			(acc, q, i) => {
				if (i === 0) return q;
				return sql`${acc} UNION ALL ${q}`;
			},
			sql``
		);

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
			ORDER BY ${sortColumn} ${sortOrder === 'desc' ? sql`DESC` : sql`ASC`}, id ASC, entityType ASC
			LIMIT ${limit} OFFSET ${offset}
		`;

		// Ejecutar query
		const result = await db.run(finalQuery);
		const rows = result.rows;

		// Mapear resultados
		const files = rows.map(mapRowToFolderFile);

		// 6. Calcular total (consulta separada optimizada)
		const totalCount = await getTotalFileCount(folderContext, includeSubfolders, search, fileTypes);

		const queryTime = Date.now() - startTime;
		const totalPages = Math.ceil(totalCount / limit);
		const currentPage = Math.floor(offset / limit) + 1;
		const hasMore = offset + limit < totalCount;

		logger.info(`Folder files query completed in ${queryTime}ms`, {
			folderId,
			includeSubfolders,
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
	context: FolderQueryContext,
	includeSubfolders: boolean,
	search?: string,
	fileTypes: string[] = ['image', 'video', 'audio', 'document', 'jsonFile', 'file3d']
): Promise<number> {
	try {
		const countQueries: Promise<number>[] = [];

		// Construir consultas de conteo para cada tipo
		if (fileTypes.includes('image')) {
			countQueries.push(
				db
					.select({ count: count() })
					.from(images)
					.where(
						and(buildWhereConditions(context, includeSubfolders, search, images), visibleImageLifecycleCondition())
					)
					.then((result: Array<{ count: number }>) => result[0]?.count || 0)
			);
		}

		if (fileTypes.includes('video')) {
			countQueries.push(
				db
					.select({ count: count() })
					.from(videos)
					.where(buildWhereConditions(context, includeSubfolders, search, videos))
					.then((result: Array<{ count: number }>) => result[0]?.count || 0)
			);
		}

		if (fileTypes.includes('audio')) {
			countQueries.push(
				db
					.select({ count: count() })
					.from(audios)
					.where(buildWhereConditions(context, includeSubfolders, search, audios))
					.then((result: Array<{ count: number }>) => result[0]?.count || 0)
			);
		}

		if (fileTypes.includes('document')) {
			countQueries.push(
				db
					.select({ count: count() })
					.from(documents)
					.where(buildWhereConditions(context, includeSubfolders, search, documents))
					.then((result: Array<{ count: number }>) => result[0]?.count || 0)
			);
		}

		if (fileTypes.includes('jsonFile')) {
			countQueries.push(
				db
					.select({ count: count() })
					.from(jsonFiles)
					.where(buildWhereConditions(context, includeSubfolders, search, jsonFiles))
					.then((result: Array<{ count: number }>) => result[0]?.count || 0)
			);
		}

		if (fileTypes.includes('file3d')) {
			countQueries.push(
				db
					.select({ count: count() })
					.from(file3Ds)
					.where(buildWhereConditions(context, includeSubfolders, search, file3Ds))
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

async function getTotalFileSize(context: FolderQueryContext, includeSubfolders: boolean): Promise<number> {
	try {
		const sumSize = <TResult extends Array<{ totalSize: number }>>(query: PromiseLike<TResult>) =>
			query.then((result) => Number(result[0]?.totalSize ?? 0));
		const sizes = await Promise.all([
			sumSize(
				db
					.select({ totalSize: sql<number>`COALESCE(SUM(${images.size}), 0)` })
					.from(images)
					.where(
						and(buildWhereConditions(context, includeSubfolders, undefined, images), visibleImageLifecycleCondition())
					)
			),
			sumSize(
				db
					.select({ totalSize: sql<number>`COALESCE(SUM(${videos.size}), 0)` })
					.from(videos)
					.where(buildWhereConditions(context, includeSubfolders, undefined, videos))
			),
			sumSize(
				db
					.select({ totalSize: sql<number>`COALESCE(SUM(${audios.size}), 0)` })
					.from(audios)
					.where(buildWhereConditions(context, includeSubfolders, undefined, audios))
			),
			sumSize(
				db
					.select({ totalSize: sql<number>`COALESCE(SUM(${documents.size}), 0)` })
					.from(documents)
					.where(buildWhereConditions(context, includeSubfolders, undefined, documents))
			),
			sumSize(
				db
					.select({ totalSize: sql<number>`COALESCE(SUM(${jsonFiles.size}), 0)` })
					.from(jsonFiles)
					.where(buildWhereConditions(context, includeSubfolders, undefined, jsonFiles))
			),
			sumSize(
				db
					.select({ totalSize: sql<number>`COALESCE(SUM(${file3Ds.size}), 0)` })
					.from(file3Ds)
					.where(buildWhereConditions(context, includeSubfolders, undefined, file3Ds))
			),
		]);
		return sizes.reduce((total, size) => total + size, 0);
	} catch (error) {
		logger.error('Error getting total file size:', error);
		return 0;
	}
}

/**
 * Obtiene estadísticas rápidas de una carpeta
 */
export async function getFolderFileStats(folderId: string, includeSubfolders = false) {
	try {
		const folderContext = await getFolderQueryContext(folderId);
		if (!folderContext) {
			return {
				images: 0,
				videos: 0,
				audios: 0,
				documents: 0,
				jsonFiles: 0,
				file3Ds: 0,
				total: 0,
				totalSize: 0,
			};
		}

		const [stats, totalSize] = await Promise.all([
			Promise.all([
				getTotalFileCount(folderContext, includeSubfolders, undefined, ['image']),
				getTotalFileCount(folderContext, includeSubfolders, undefined, ['video']),
				getTotalFileCount(folderContext, includeSubfolders, undefined, ['audio']),
				getTotalFileCount(folderContext, includeSubfolders, undefined, ['document']),
				getTotalFileCount(folderContext, includeSubfolders, undefined, ['jsonFile']),
				getTotalFileCount(folderContext, includeSubfolders, undefined, ['file3d']),
			]),
			getTotalFileSize(folderContext, includeSubfolders),
		]);

		return {
			images: stats[0],
			videos: stats[1],
			audios: stats[2],
			documents: stats[3],
			jsonFiles: stats[4],
			file3Ds: stats[5],
			total: stats.reduce((sum, count) => sum + count, 0),
			totalSize,
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
			totalSize: 0,
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
	// audios, documents, jsonFile, file3d no tienen thumbnail API por defecto

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
