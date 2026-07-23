/**
 * Express Routes para Folders usando Effect
 * @module server/routes/folders.effect
 * @description Rutas REST para Folders implementadas con Effect-TS
 * @created 2025-10-11 - Fase 7.3 FolderService Effect Implementation
 */

import { Schema } from '@effect/schema';
import { Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import { setAuthorizedAssetCacheHeaders } from '@/server/security/authorized-asset-cache';
import { FolderCreateInput, FolderUpdateInput } from '@/lib/effect/schemas/entities';
import { listFavoriteEntities } from '@/server/utils/favorite-route';
import {
	authorizeFolderPathById,
	authorizeMediaPathInput,
	filterAuthorizedMixedMediaEntities,
	getAuthorizedRootRegistry,
} from '@/server/security/authorized-root-request';
import { RootAuthorizationError } from '@/server/security/authorized-roots';
import { sanitizeJsonResponses } from '@/server/security/sanitize-public-payload';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FolderService, FolderServiceLive } from '@/services/folder/folder.service.effect';
import { embedFolderPreviewMedia } from '@/services/folder/folder-preview-media.service';
import { FolderReindexService } from '@/services/folder/reindex/folder-reindex.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';
import {
	buildFolderPreviewSvg,
	extractRecentPreviews,
	formatBytes,
	sanitizePreviewCount,
	normalizePreviewFiles,
} from '../utils/folder-preview-svg';

const router = express.Router();
router.use(sanitizeJsonResponses);

const reindexService = FolderReindexService.getInstance();

type FolderRecord = Record<string, unknown> & { children?: FolderRecord[]; id?: string; path?: string };

async function toPublicFolder(
	request: { app: { locals: Record<string, unknown> } },
	folder: FolderRecord
): Promise<Record<string, unknown> | null> {
	if (typeof folder.path !== 'string') return null;
	try {
		const authorized = await getAuthorizedRootRegistry(request).authorizeAbsolutePath(folder.path, 'read');
		const { path: _path, children, ...safeFolder } = folder;
		const publicChildren = children
			? (await Promise.all(children.map((child) => toPublicFolder(request, child)))).filter(
					(child): child is Record<string, unknown> => child !== null
				)
			: undefined;
		return {
			...safeFolder,
			...(publicChildren ? { children: publicChildren } : {}),
			relativePath: authorized.relativePath,
			rootId: authorized.rootId,
		};
	} catch (error) {
		if (error instanceof RootAuthorizationError) return null;
		throw error;
	}
}

async function toPublicFolders(
	request: { app: { locals: Record<string, unknown> } },
	folders: FolderRecord[]
): Promise<Record<string, unknown>[]> {
	return (await Promise.all(folders.map((folder) => toPublicFolder(request, folder)))).filter(
		(folder): folder is Record<string, unknown> => folder !== null
	);
}

function sanitizeFolderFilesPayload(payload: unknown): unknown {
	if (!(payload && typeof payload === 'object' && !Array.isArray(payload))) return payload;
	const record = payload as Record<string, unknown>;
	if (!Array.isArray(record.files)) return payload;
	return {
		...record,
		files: record.files.map((file) => {
			if (!(file && typeof file === 'object' && !Array.isArray(file))) return file;
			const { path: _path, ...safeFile } = file as Record<string, unknown>;
			return safeFile;
		}),
	};
}

// Importar servicios de archivos existentes para endpoints de archivos
interface FolderFileRecord {
	entityType: 'image' | 'video' | 'audio' | 'document' | 'jsonFile' | 'file3d';
	id: string;
	path: string;
	size?: number;
}

interface FolderFilesResult {
	files: FolderFileRecord[];
	hasMore: boolean;
	pagination: { currentPage: number; limit: number; offset: number; totalPages: number };
	performance: { processedRecords: number; queryTime: number };
	total: number;
}

interface FolderFileCounts {
	audios: number;
	documents: number;
	file3Ds: number;
	images: number;
	jsonFiles: number;
	videos: number;
}

type FolderFilesGetter = (opts: {
	cursor?: string;
	fileTypes?: Array<'image' | 'video' | 'audio' | 'document' | 'jsonFile' | 'file3d'>;
	folderId: string;
	includeSubfolders?: boolean;
	limit?: number;
	offset?: number;
	search?: string;
	sortBy?: 'name' | 'size' | 'createdAt' | 'updatedAt';
	sortOrder?: 'asc' | 'desc';
}) => Promise<FolderFilesResult>;

let getFolderFiles: FolderFilesGetter | undefined;

// Cargar módulos de archivos dinámicamente
const loadFolderFilesServices = async () => {
	if (!getFolderFiles) {
		const module = await import('@/services/folder-files/folder-files.service');
		getFolderFiles = module.getFolderFiles;
	}
};

async function getAuthorizedFolderFiles(
	request: { app: { locals: Record<string, unknown> } },
	options: Parameters<FolderFilesGetter>[0],
	page: { limit: number; offset: number }
): Promise<{ counts: FolderFileCounts; result: FolderFilesResult; totalSize: number }> {
	const startedAt = Date.now();
	const authorizedFiles: FolderFileRecord[] = [];
	let processedRecords = 0;
	let rawOffset = 0;
	let totalSize = 0;
	const chunkSize = 500;

	while (true) {
		const chunk = await getFolderFiles!({ ...options, limit: chunkSize, offset: rawOffset });
		processedRecords += chunk.files.length;
		const authorizedChunk = await filterAuthorizedMixedMediaEntities(request, chunk.files, ['read', 'index']);
		authorizedFiles.push(...authorizedChunk);
		for (const file of authorizedChunk) {
			const size = file.size;
			if (typeof size === 'number' && Number.isFinite(size) && size > 0) totalSize += size;
		}
		rawOffset += chunk.files.length;
		if (chunk.files.length === 0 || rawOffset >= chunk.total) break;
	}

	const files = authorizedFiles.slice(page.offset, page.offset + page.limit);
	const total = authorizedFiles.length;
	const counts: FolderFileCounts = { images: 0, videos: 0, audios: 0, documents: 0, jsonFiles: 0, file3Ds: 0 };
	for (const file of authorizedFiles) {
		if (file.entityType === 'image') counts.images += 1;
		else if (file.entityType === 'video') counts.videos += 1;
		else if (file.entityType === 'audio') counts.audios += 1;
		else if (file.entityType === 'document') counts.documents += 1;
		else if (file.entityType === 'jsonFile') counts.jsonFiles += 1;
		else counts.file3Ds += 1;
	}
	return {
		counts,
		result: {
			files,
			hasMore: page.offset + page.limit < total,
			pagination: {
				currentPage: Math.floor(page.offset / page.limit) + 1,
				limit: page.limit,
				offset: page.offset,
				totalPages: Math.ceil(total / page.limit),
			},
			performance: { processedRecords, queryTime: Date.now() - startedAt },
			total,
		},
		totalSize,
	};
}

async function getAuthorizedFolderPreviewData(
	request: { app: { locals: Record<string, unknown> } },
	folderId: string,
	max: number
): Promise<{ previewFiles: FolderFileRecord[]; total: number; totalSize: number }> {
	const previewFiles: FolderFileRecord[] = [];
	let rawOffset = 0;
	let total = 0;
	let totalSize = 0;
	const chunkSize = 500;

	while (true) {
		const chunk = await getFolderFiles!({
			folderId,
			includeSubfolders: true,
			limit: chunkSize,
			offset: rawOffset,
			sortBy: 'updatedAt',
			sortOrder: 'desc',
		});
		const authorizedChunk = await filterAuthorizedMixedMediaEntities(request, chunk.files, ['read', 'index']);

		for (const file of authorizedChunk) {
			total += 1;
			const size = file.size;
			if (typeof size === 'number' && Number.isFinite(size) && size > 0) totalSize += size;
			if (previewFiles.length < max && (file.entityType === 'image' || file.entityType === 'video')) {
				previewFiles.push(file);
			}
		}

		rawOffset += chunk.files.length;
		if (chunk.files.length === 0 || rawOffset >= chunk.total) break;
	}

	return { previewFiles, total, totalSize };
}

/**
 * GET /folders/:id/files - Obtener archivos de una carpeta
 */
router.get(
	'/:id/files',
	authorizeFolderPathById('read'),
	effectHandler((req) =>
		Effect.gen(function* () {
			yield* Effect.tryPromise({
				try: () => loadFolderFilesServices(),
				catch: (err) => new Error(`Failed to load folder files service: ${err}`),
			});

			const { id: folderId } = req.params;
			const {
				includeSubfolders = 'false',
				limit = '150',
				offset = '0',
				search,
				sortBy = 'name',
				sortOrder = 'asc',
				fileTypes,
			} = req.query as Record<string, string | undefined>;

			const parsedLimit = sanitizeLimit(limit, 150, 500);
			const parsedOffset = sanitizeOffset(offset);
			const validFileTypes = ['image', 'video', 'audio', 'document', 'jsonFile', 'file3d'] as const;
			type ValidFileType = (typeof validFileTypes)[number];
			const parsedFileTypes: ValidFileType[] = fileTypes
				? fileTypes
						.split(',')
						.filter((type): type is ValidFileType => (validFileTypes as readonly string[]).includes(type))
				: [...validFileTypes];

			const result = yield* Effect.tryPromise({
				try: () =>
					getAuthorizedFolderFiles(
						req,
						{
							folderId,
							includeSubfolders: includeSubfolders === 'true',
							search,
							sortBy: (sortBy as 'name' | 'size' | 'createdAt' | 'updatedAt') || 'name',
							sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
							fileTypes: parsedFileTypes,
						},
						{ limit: parsedLimit, offset: parsedOffset }
					),
				catch: (err) => {
					throw new Error(`Failed to fetch folder files: ${err instanceof Error ? err.message : String(err)}`);
				},
			});

			return sanitizeFolderFilesPayload(result.result);
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * GET /folders/:id/files/stats - Obtener estadísticas de archivos de una carpeta
 */
router.get(
	'/:id/files/stats',
	authorizeFolderPathById('read'),
	effectHandler((req) =>
		Effect.gen(function* () {
			yield* Effect.tryPromise({
				try: () => loadFolderFilesServices(),
				catch: (err) => new Error(`Failed to load folder files service: ${err}`),
			});

			const { id: folderId } = req.params;
			const { includeSubfolders = 'false' } = req.query as Record<string, string | undefined>;

			const result = yield* Effect.tryPromise({
				try: () =>
					getAuthorizedFolderFiles(
						req,
						{ folderId, includeSubfolders: includeSubfolders === 'true' },
						{ limit: 1, offset: 0 }
					),
				catch: (err) => {
					throw new Error(`Failed to fetch folder stats: ${err instanceof Error ? err.message : String(err)}`);
				},
			});

			return { ...result.counts, total: result.result.total };
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * GET /folders - Listar carpetas con filtros
 */
router.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			yield* Effect.tryPromise({
				try: () => loadFolderFilesServices(),
				catch: (err) => new Error(`Failed to load folder files service: ${String(err)}`),
			});

			const folderService = yield* FolderService;

			const {
				search,
				limit = '50',
				offset = '0',
				sortBy = 'name',
				sortOrder = 'asc',
				parentId,
				onlyFavorites,
			} = req.query;

			const options = {
				search: search as string | undefined,
				limit: sanitizeLimit(limit as string),
				offset: sanitizeOffset(offset as string),
				orderBy: (sortBy as 'name' | 'createdAt' | 'updatedAt') || 'name',
				orderDirection: (sortOrder as 'asc' | 'desc') || 'asc',
				parentId: parentId === 'null' ? null : (parentId as string | null | undefined),
				onlyFavorites: onlyFavorites === 'true' ? true : undefined,
			};

			if (options.onlyFavorites) {
				const favoriteResult = yield* listFavoriteEntities({
					entityType: FavoriteEntityType.FOLDER,
					search: options.search,
					limit: options.limit,
					offset: options.offset,
					sortBy: options.orderBy,
					sortOrder: options.orderDirection,
					getEntityById: (entityId: string) => folderService.getById(entityId),
				});

				const foldersWithRecentImages = yield* Effect.all(
					favoriteResult.data.map((folder) =>
						Effect.tryPromise({
							try: async () => {
								const previewPayload = await getFolderFiles!({
									folderId: folder.id,
									includeSubfolders: true,
									limit: 4,
									offset: 0,
									sortBy: 'updatedAt',
									sortOrder: 'desc',
									fileTypes: ['image', 'video'],
								});

								return {
									...folder,
									recentImages: extractRecentPreviews(
										{ files: await filterAuthorizedMixedMediaEntities(req, previewPayload.files, ['read', 'index']) },
										4
									),
								};
							},
							catch: () => ({
								...folder,
								recentImages: [],
							}),
						})
					)
				);
				const publicFolders = yield* Effect.tryPromise({
					try: () => toPublicFolders(req, foldersWithRecentImages as unknown as FolderRecord[]),
					catch: (error) => new Error(`Failed to authorize folders: ${String(error)}`),
				});

				return {
					data: publicFolders,
					pagination: {
						total: publicFolders.length,
						limit: options.limit,
						offset: options.offset,
						hasNext: publicFolders.length >= options.limit,
						hasPrev: options.offset > 0,
					},
				};
			}

			const result = yield* folderService.getAll(options);
			const foldersWithRecentImages = yield* Effect.all(
				result.folders.map((folder) =>
					Effect.tryPromise({
						try: async () => {
							const previewPayload = await getFolderFiles!({
								folderId: folder.id,
								includeSubfolders: true,
								limit: 4,
								offset: 0,
								sortBy: 'updatedAt',
								sortOrder: 'desc',
								fileTypes: ['image', 'video'],
							});

							return {
								...folder,
								recentImages: extractRecentPreviews(
									{ files: await filterAuthorizedMixedMediaEntities(req, previewPayload.files, ['read', 'index']) },
									4
								),
							};
						},
						catch: () => ({
							...folder,
							recentImages: [],
						}),
					})
				)
			);
			const publicFolders = yield* Effect.tryPromise({
				try: () => toPublicFolders(req, foldersWithRecentImages as unknown as FolderRecord[]),
				catch: (error) => new Error(`Failed to authorize folders: ${String(error)}`),
			});

			return {
				data: publicFolders,
				pagination: {
					total: publicFolders.length,
					limit: result.limit,
					offset: result.offset,
					hasNext: publicFolders.length >= result.limit,
					hasPrev: result.offset > 0,
				},
			};
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * GET /folders/tree - Obtener árbol completo de carpetas
 * IMPORTANTE: Debe ir ANTES de /:id para evitar conflicto de rutas
 */
router.get(
	'/tree',
	effectHandler((req) =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			const folders = yield* folderService.getTree();
			return yield* Effect.tryPromise({
				try: () => toPublicFolders(req, folders as unknown as FolderRecord[]),
				catch: (error) => new Error(`Failed to authorize folder tree: ${String(error)}`),
			});
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * GET /folders/:id/preview - Obtener preview SVG cacheable de una carpeta
 */
router.get(
	'/:id/preview',
	authorizeFolderPathById('read'),
	effectHandler(
		(req) =>
			Effect.gen(function* () {
				yield* Effect.tryPromise({
					try: () => loadFolderFilesServices(),
					catch: (err) => new Error(`Failed to load folder preview services: ${String(err)}`),
				});

				const folderService = yield* FolderService;
				const folder = yield* folderService.getById(req.params.id);
				const max = sanitizePreviewCount(req.query.max);
				const previewData = yield* Effect.tryPromise({
					try: () =>
						getAuthorizedFolderPreviewData(req, req.params.id, max),
					catch: (err) => new Error(`Failed to fetch authorized folder preview data: ${String(err)}`),
				});

				const previewFiles = normalizePreviewFiles({ files: previewData.previewFiles }, max);
				const embeddedPreviewFiles = yield* Effect.tryPromise({
					try: () => embedFolderPreviewMedia(previewFiles),
					catch: (err) => new Error(`Failed to embed folder preview media: ${String(err)}`),
				});

				return {
					folder,
					previewFiles: embeddedPreviewFiles,
					previewStats: { total: previewData.total, totalSize: previewData.totalSize },
				};
			}).pipe(Effect.provide(FolderServiceLive)),
		{
			onSuccess: ({ folder, previewFiles, previewStats }, res) => {
				const name = folder.name || 'Carpeta';
				const authorizedReference = res.locals.authorizedRootReference as
					| { relativePath: string; rootId: string }
					| undefined;
				const path = authorizedReference?.relativePath || '/';
				const totalFiles = previewStats.total;
				const totalSize = formatBytes(previewStats.totalSize);
				const svg = buildFolderPreviewSvg({
					previewFiles,
					name,
					path,
					totalFiles,
					totalSize,
				});

				res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
				res.setHeader('Content-Security-Policy', "default-src 'none'; img-src data:; style-src 'unsafe-inline'");
				setAuthorizedAssetCacheHeaders(res, 'revalidate');
				res.status(200).send(svg);
			},
		}
	)
);

/**
 * GET /folders/root - Obtener carpetas raíz
 */
router.get(
	'/root',
	effectHandler((req) =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			const folders = yield* folderService.getChildren(null);
			return yield* Effect.tryPromise({
				try: () => toPublicFolders(req, folders as unknown as FolderRecord[]),
				catch: (error) => new Error(`Failed to authorize root folders: ${String(error)}`),
			});
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * GET /folders/:id - Obtener carpeta por ID
 */
router.get(
	'/:id',
	authorizeFolderPathById('read'),
	effectHandler((req) =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			const folder = yield* folderService.getById(req.params.id);
			const publicFolder = yield* Effect.tryPromise({
				try: () => toPublicFolder(req, folder as unknown as FolderRecord),
				catch: (error) => new Error(`Failed to authorize folder: ${String(error)}`),
			});
			if (!publicFolder) return yield* Effect.fail(new Error('Folder no autorizado'));
			return publicFolder;
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * POST /folders - Crear nueva carpeta
 */
router.post(
	'/',
	authorizeMediaPathInput({ expected: 'directory', required: true }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			const input = yield* Schema.decodeUnknown(FolderCreateInput)(req.body);
			const folder = yield* folderService.create(input);
			res.status(201);
			const publicFolder = yield* Effect.tryPromise({
				try: () => toPublicFolder(req, folder as unknown as FolderRecord),
				catch: (error) => new Error(`Failed to authorize created folder: ${String(error)}`),
			});
			if (!publicFolder) return yield* Effect.fail(new Error('Folder creado fuera de roots autorizados'));
			return publicFolder;
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * PUT /folders/:id - Actualizar carpeta
 */
router.put(
	'/:id',
	authorizeFolderPathById('index'),
	authorizeFolderPathById('write'),
	authorizeMediaPathInput({ expected: 'directory', permissions: ['read', 'index', 'write'], required: false }),
	effectHandler((req) =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			const input = yield* Schema.decodeUnknown(FolderUpdateInput)(req.body);
			const folder = yield* folderService.update(req.params.id, input);
			const publicFolder = yield* Effect.tryPromise({
				try: () => toPublicFolder(req, folder as unknown as FolderRecord),
				catch: (error) => new Error(`Failed to authorize updated folder: ${String(error)}`),
			});
			if (!publicFolder) return yield* Effect.fail(new Error('Folder no autorizado'));
			return publicFolder;
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * DELETE /folders/:id - Eliminar carpeta
 */
router.delete(
	'/:id',
	authorizeFolderPathById('delete'),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			const { force } = req.query;
			const forceDelete = force === 'true';
			yield* folderService.delete(req.params.id, forceDelete);
			res.status(204);
			return { success: true };
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * GET /folders/:id/ancestors - Obtener ancestros de una carpeta
 */
router.get(
	'/:id/ancestors',
	authorizeFolderPathById('read'),
	effectHandler((req) =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			const folders = yield* folderService.getAncestors(req.params.id);
			return yield* Effect.tryPromise({
				try: () => toPublicFolders(req, folders as unknown as FolderRecord[]),
				catch: (error) => new Error(`Failed to authorize folder ancestors: ${String(error)}`),
			});
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * POST /folders/reindex-all - Reindexar todas las carpetas
 */
router.post('/reindex-all', (_req, res) => {
	res.status(410).json({
		code: 'AUTHORIZED_ROOTS_REQUIRED',
		message: 'El reindex global fue retirado; reindexa folders autorizados por ID.',
		retryable: false,
	});
});

/**
 * POST /folders/:id/reindex - Reindexar una carpeta específica con flujo estructurado
 */
router.post(
	'/:id/reindex',
	authorizeFolderPathById('index'),
	(req, res, next) => {
		if (req.body?.skipThumbnails === true || req.body?.skipMetadata === true) {
			res.status(400).json({
				code: 'UNSUPPORTED_REINDEX_OPTION',
				message: 'El reindex canónico procesa la ingesta completa y no admite omitir metadata ni derivados.',
				retryable: false,
			});
			return;
		}
		next();
	},
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const folderId = req.params.id;
			const options = req.body || {};

			serverLogger.debug('Reindexando carpeta específica', { folderId, options });

			const result = yield* Effect.tryPromise({
				try: () =>
					reindexService.executeStructuredReindex(
						{
							folderId,
							emitEvents: true,
							includeSubfolders: options.includeSubfolders ?? true,
							concurrency: 3,
						},
						{ authorizedRootRegistry: getAuthorizedRootRegistry(req) }
					),
				catch: (error) => new Error(`Reindex failed: ${error instanceof Error ? error.message : 'Unknown error'}`),
			});

			res.json({
				success: result.success,
				folderId,
				phases: result.phases,
				summary: result.summary,
				totalDuration: result.totalDuration,
			});

			return result;
		})
	)
);

/**
 * POST /folders/reindex - Iniciar reindexado de carpetas
 * @deprecated Usar /folders/:id/reindex o /folders/reindex-all
 */
router.post('/reindex', (_req, res) => {
	res.status(410).json({
		code: 'LEGACY_REINDEX_RETIRED',
		message: 'Usa /folders/:id/reindex con un folder autorizado.',
		retryable: false,
	});
});

export default router;
