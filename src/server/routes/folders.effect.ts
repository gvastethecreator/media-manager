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
import { FolderCreateInput, FolderUpdateInput } from '@/lib/effect/schemas/entities';
import { FolderService, FolderServiceLive } from '@/services/folder/folder.service.effect';
import { FolderReindexService } from '@/services/folder/reindex/folder-reindex.service';

const router = express.Router();

const reindexService = FolderReindexService.getInstance();

// Importar servicios de archivos existentes para endpoints de archivos
let getFolderFiles: any;
let getFolderFileStats: any;

// Cargar módulos de archivos dinámicamente
const loadFolderFilesServices = async () => {
	if (!getFolderFiles) {
		const module = await import('@/services/folder-files/folder-files.service');
		getFolderFiles = module.getFolderFiles;
		getFolderFileStats = module.getFolderFileStats;
	}
};

/**
 * GET /folders/:id/files - Obtener archivos de una carpeta
 */
router.get(
	'/:id/files',
	effectHandler((req) =>
		Effect.gen(function* () {
			yield* Effect.tryPromise({
				try: () => loadFolderFilesServices(),
				catch: (err) => new Error(`Failed to load folder files service: ${err}`),
			});

			console.log('🔍 [DEBUG] /:id/files params:', req.params, 'url:', req.url);
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

			const parsedLimit = Math.min(Math.max(1, Number.parseInt(limit || '150', 10) || 150), 500);
			const parsedOffset = Math.max(0, Number.parseInt(offset || '0', 10) || 0);
			const parsedFileTypes = fileTypes
				? fileTypes
						.split(',')
						.filter((type) => ['image', 'video', 'audio', 'document', 'jsonFile', 'file3d'].includes(type))
				: ['image', 'video', 'audio', 'document', 'jsonFile', 'file3d'];

			const result = yield* Effect.tryPromise({
				try: () =>
					getFolderFiles({
						folderId,
						includeSubfolders: includeSubfolders === 'true',
						limit: parsedLimit,
						offset: parsedOffset,
						search,
						sortBy: sortBy as any,
						sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
						fileTypes: parsedFileTypes as any,
					}),
				catch: (err) => {
					throw new Error(`Failed to fetch folder files: ${err instanceof Error ? err.message : String(err)}`);
				},
			});

			return result;
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * GET /folders/:id/files/stats - Obtener estadísticas de archivos de una carpeta
 */
router.get(
	'/:id/files/stats',
	effectHandler((req) =>
		Effect.gen(function* () {
			yield* Effect.tryPromise({
				try: () => loadFolderFilesServices(),
				catch: (err) => new Error(`Failed to load folder files service: ${err}`),
			});

			const { id: folderId } = req.params;
			const { includeSubfolders = 'false' } = req.query as Record<string, string | undefined>;

			const result = yield* Effect.tryPromise({
				try: () => getFolderFileStats(folderId, includeSubfolders === 'true'),
				catch: (err) => {
					throw new Error(`Failed to fetch folder stats: ${err instanceof Error ? err.message : String(err)}`);
				},
			});

			return result;
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
				limit: Number.parseInt(limit as string, 10),
				offset: Number.parseInt(offset as string, 10),
				orderBy: (sortBy as 'name' | 'createdAt' | 'updatedAt') || 'name',
				orderDirection: (sortOrder as 'asc' | 'desc') || 'asc',
				parentId: parentId === 'null' ? null : (parentId as string | null | undefined),
				onlyFavorites: onlyFavorites === 'true' ? true : undefined,
			};

			const result = yield* folderService.getAll(options);

			return {
				data: result.folders,
				pagination: {
					total: result.total,
					limit: result.limit,
					offset: result.offset,
					hasNext: result.limit + result.offset < result.total,
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
	effectHandler(() =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			return yield* folderService.getTree();
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * GET /folders/:id - Obtener carpeta por ID
 */
router.get(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			return yield* folderService.getById(req.params.id);
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * POST /folders - Crear nueva carpeta
 */
router.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			const input = yield* Schema.decodeUnknown(FolderCreateInput)(req.body);
			const folder = yield* folderService.create(input);
			res.status(201);
			return folder;
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * PUT /folders/:id - Actualizar carpeta
 */
router.put(
	'/:id',
	effectHandler((req) =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			const input = yield* Schema.decodeUnknown(FolderUpdateInput)(req.body);
			return yield* folderService.update(req.params.id, input);
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * DELETE /folders/:id - Eliminar carpeta
 */
router.delete(
	'/:id',
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
	effectHandler((req) =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			return yield* folderService.getAncestors(req.params.id);
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * POST /folders/:id/favorite - Toggle favorite status
 */
router.post(
	'/:id/favorite',
	effectHandler((req) =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			return yield* folderService.toggleFavorite(req.params.id);
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * GET /folders/root - Obtener carpetas raíz
 */
router.get(
	'/root',
	effectHandler(() =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			return yield* folderService.getChildren(null);
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

/**
 * POST /folders/reindex-all - Reindexar todas las carpetas
 */
router.post(
	'/reindex-all',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const options = req.body || {};

			const result = yield* Effect.tryPromise({
				try: () =>
					reindexService.executeStructuredReindex({
						emitEvents: true,
						includeSubfolders: true,
						skipThumbnails: options.skipThumbnails,
						skipMetadata: options.skipMetadata,
						concurrency: 3,
					}),
				catch: (error) => new Error(`Reindex failed: ${error instanceof Error ? error.message : 'Unknown error'}`),
			});

			res.json({
				processed: result.summary.foldersProcessed,
				errors: Object.values(result.phases)
					.flatMap((phase) => phase.errors)
					.filter(Boolean),
			});

			return result;
		})
	)
);

/**
 * POST /folders/:id/reindex - Reindexar una carpeta específica con flujo estructurado
 */
router.post(
	'/:id/reindex',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const folderId = req.params.id;
			const options = req.body || {};

			console.log('🔄 [DEBUG] Reindexando carpeta específica:', { folderId, options });

			const result = yield* Effect.tryPromise({
				try: () =>
					reindexService.executeStructuredReindex({
						folderId,
						emitEvents: true,
						includeSubfolders: options.includeSubfolders ?? true,
						skipThumbnails: options.skipThumbnails,
						skipMetadata: options.skipMetadata,
						concurrency: 3,
					}),
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
router.post(
	'/reindex',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { folderIds } = req.body;
			if (!Array.isArray(folderIds) || folderIds.length === 0) {
				return yield* Effect.fail(new Error('folderIds must be a non-empty array'));
			}

			// Reindexar la primera carpeta del array (mantener compatibilidad)
			const folderId = folderIds[0];
			console.log('🔄 [DEBUG] Reindexando desde endpoint /reindex (legacy):', { folderId });

			const result = yield* Effect.tryPromise({
				try: () =>
					reindexService.executeStructuredReindex({
						folderId,
						emitEvents: true,
						includeSubfolders: true,
						concurrency: 3,
					}),
				catch: (error) => new Error(`Reindex failed: ${error instanceof Error ? error.message : 'Unknown error'}`),
			});

			res.json({
				success: result.success,
				folderId,
				folderIds,
				message: 'Reindex completed',
				phases: result.phases,
				summary: result.summary,
			});
		})
	)
);

/**
 * POST /folders/:id/favorite - Toggle favorite status
 */
router.post(
	'/:id/favorite',
	effectHandler((req) =>
		Effect.gen(function* () {
			const folderService = yield* FolderService;
			return yield* folderService.toggleFavorite(req.params.id);
		}).pipe(Effect.provide(FolderServiceLive))
	)
);

export default router;
