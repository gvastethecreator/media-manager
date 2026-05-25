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
import { FolderCreateInput, FolderUpdateInput } from '@/lib/effect/schemas/entities';
import { listFavoriteEntities } from '@/server/utils/favorite-route';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FolderService, FolderServiceLive } from '@/services/folder/folder.service.effect';
import { FolderReindexService } from '@/services/folder/reindex/folder-reindex.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

const router = express.Router();

const reindexService = FolderReindexService.getInstance();

// Importar servicios de archivos existentes para endpoints de archivos
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
}) => Promise<unknown>;
type FolderFileStatsGetter = (folderId: string, includeSubfolders: boolean) => Promise<unknown>;

let getFolderFiles: FolderFilesGetter | undefined;
let getFolderFileStats: FolderFileStatsGetter | undefined;

interface FolderPreviewFile {
	id: string;
	name: string;
	thumbnailPath: string;
}

interface FolderRecentPreview {
	id: string;
	name: string;
	thumbnailUrl: string;
}

function escapeXml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function formatBytes(bytes: number) {
	if (!Number.isFinite(bytes) || bytes <= 0) {
		return '0 B';
	}

	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let value = bytes;
	let unitIndex = 0;

	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex++;
	}

	const decimals = unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
	return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

function sanitizePreviewCount(value: unknown, fallback = 4) {
	const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number.NaN;
	if (!Number.isFinite(parsed)) {
		return fallback;
	}

	return Math.min(Math.max(parsed, 1), 4);
}

function normalizePreviewFiles(payload: unknown, baseUrl: string, max: number): FolderPreviewFile[] {
	const files = Array.isArray((payload as { files?: unknown[] } | null)?.files)
		? ((payload as { files: unknown[] }).files ?? [])
		: [];

	return files
		.map((file) => {
			const candidate = file as {
				id?: unknown;
				name?: unknown;
				thumbnailPath?: unknown;
			};
			if (typeof candidate.id !== 'string' || typeof candidate.thumbnailPath !== 'string') {
				return null;
			}

			const thumbnailPath = candidate.thumbnailPath.startsWith('http')
				? candidate.thumbnailPath
				: `${baseUrl}${candidate.thumbnailPath.startsWith('/') ? candidate.thumbnailPath : `/${candidate.thumbnailPath}`}`;

			return {
				id: candidate.id,
				name: typeof candidate.name === 'string' ? candidate.name : 'Preview',
				thumbnailPath,
			};
		})
		.filter((file): file is FolderPreviewFile => file !== null)
		.slice(0, max);
}

function extractRecentPreviews(payload: unknown, baseUrl: string, max: number): FolderRecentPreview[] {
	return normalizePreviewFiles(payload, baseUrl, max).map((file) => ({
		id: file.id,
		name: file.name,
		thumbnailUrl: file.thumbnailPath,
	}));
}

function buildPreviewSlots(count: number) {
	if (count <= 1) {
		return [{ x: 0, y: 0, width: 1, height: 1 }];
	}

	if (count === 2) {
		return [
			{ x: 0, y: 0, width: 0.5, height: 1 },
			{ x: 0.5, y: 0, width: 0.5, height: 1 },
		];
	}

	if (count === 3) {
		return [
			{ x: 0, y: 0, width: 0.56, height: 1 },
			{ x: 0.56, y: 0, width: 0.44, height: 0.5 },
			{ x: 0.56, y: 0.5, width: 0.44, height: 0.5 },
		];
	}

	return [
		{ x: 0, y: 0, width: 0.5, height: 0.5 },
		{ x: 0.5, y: 0, width: 0.5, height: 0.5 },
		{ x: 0, y: 0.5, width: 0.5, height: 0.5 },
		{ x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
	];
}

function buildFolderPreviewSvg(input: {
	previewFiles: FolderPreviewFile[];
	name: string;
	path: string;
	totalFiles: number;
	totalSize: string;
}) {
	const { previewFiles, name, path, totalFiles, totalSize } = input;
	const clipId = `folder-preview-clip-${previewFiles.map((file) => file.id).join('-') || 'empty'}`;
	const previewX = 74;
	const previewY = 122;
	const previewWidth = 260;
	const previewHeight = 126;
	const slots = buildPreviewSlots(previewFiles.length || 1);

	const previewMarkup =
		previewFiles.length > 0
			? `<g clip-path="url(#${clipId})">${previewFiles
					.map((file, index) => {
						const slot = slots[Math.min(index, slots.length - 1)];
						const x = previewX + slot.x * previewWidth;
						const y = previewY + slot.y * previewHeight;
						const width = slot.width * previewWidth;
						const height = slot.height * previewHeight;
						return `<image href="${escapeXml(file.thumbnailPath)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
					})
					.join(
						''
					)}<rect x="${previewX}" y="${previewY}" width="${previewWidth}" height="${previewHeight}" fill="url(#folderPreviewTint)"/></g>`
			: `<g clip-path="url(#${clipId})"><rect x="${previewX}" y="${previewY}" width="${previewWidth}" height="${previewHeight}" fill="#1e293b"/><path d="M134 150h54l20 22h78c11 0 20 9 20 20v28c0 11-9 20-20 20H134c-11 0-20-9-20-20v-50c0-11 9-20 20-20Z" fill="#fbbf24" fill-opacity="0.92"/></g>`;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" role="img" aria-label="Preview de carpeta ${name}">
  <defs>
    <linearGradient id="folderPreviewBg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="folderBody" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="folderFront" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#fff4d6" stop-opacity="0.76"/>
      <stop offset="100%" stop-color="#fed7aa" stop-opacity="0.58"/>
    </linearGradient>
    <linearGradient id="folderPreviewTint" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.24"/>
    </linearGradient>
    <linearGradient id="folderGlow" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#fb7185" stop-opacity="0.22"/>
    </linearGradient>
    <clipPath id="${clipId}">
      <rect x="${previewX}" y="${previewY}" width="${previewWidth}" height="${previewHeight}" rx="18"/>
    </clipPath>
  </defs>
  <rect width="640" height="360" fill="url(#folderPreviewBg)" rx="24"/>
  <rect x="16" y="16" width="608" height="328" fill="#0f172a" fill-opacity="0.68" rx="20" stroke="#334155" stroke-opacity="0.72"/>
  <rect x="20" y="20" width="600" height="320" fill="url(#folderGlow)" rx="18"/>
  <rect x="66" y="92" width="128" height="36" rx="14" fill="url(#folderBody)"/>
  <rect x="58" y="108" width="290" height="148" rx="24" fill="url(#folderBody)"/>
  ${previewMarkup}
  <rect x="66" y="116" width="276" height="138" rx="22" fill="url(#folderFront)" stroke="#ffffff" stroke-opacity="0.18"/>
  <rect x="386" y="82" width="190" height="196" rx="22" fill="#111827" fill-opacity="0.72" stroke="#334155" stroke-opacity="0.72"/>
  <text x="410" y="124" fill="#f8fafc" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="28" font-weight="700">${name}</text>
  <text x="410" y="156" fill="#94a3b8" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="15">${path}</text>
  <text x="410" y="204" fill="#f8fafc" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="42" font-weight="700">${totalFiles}</text>
  <text x="410" y="230" fill="#cbd5e1" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="14">archivos detectados</text>
  <text x="410" y="266" fill="#e2e8f0" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="15">${totalSize}</text>
  <text x="410" y="292" fill="#94a3b8" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="13">Preview viva con media reciente</text>
</svg>`;
}

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
					getFolderFiles!({
						folderId,
						includeSubfolders: includeSubfolders === 'true',
						limit: parsedLimit,
						offset: parsedOffset,
						search,
						sortBy: (sortBy as 'name' | 'size' | 'createdAt' | 'updatedAt') || 'name',
						sortOrder: (sortOrder as 'asc' | 'desc') || 'asc',
						fileTypes: parsedFileTypes,
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
				try: () => getFolderFileStats!(folderId, includeSubfolders === 'true'),
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

				const baseUrl = `${req.protocol}://${req.get('host') ?? 'localhost:4000'}`;
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
									recentImages: extractRecentPreviews(previewPayload, baseUrl, 4),
								};
							},
							catch: () => ({
								...folder,
								recentImages: [],
							}),
						})
					)
				);

				return {
					data: foldersWithRecentImages,
					pagination: {
						total: favoriteResult.total,
						limit: options.limit,
						offset: options.offset,
						hasNext: options.limit + options.offset < favoriteResult.total,
						hasPrev: options.offset > 0,
					},
				};
			}

			const result = yield* folderService.getAll(options);
			const baseUrl = `${req.protocol}://${req.get('host') ?? 'localhost:4000'}`;
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
								recentImages: extractRecentPreviews(previewPayload, baseUrl, 4),
							};
						},
						catch: () => ({
							...folder,
							recentImages: [],
						}),
					})
				)
			);

			return {
				data: foldersWithRecentImages,
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
 * GET /folders/:id/preview - Obtener preview SVG cacheable de una carpeta
 */
router.get(
	'/:id/preview',
	effectHandler(
		(req) =>
			Effect.gen(function* () {
				yield* Effect.tryPromise({
					try: () => loadFolderFilesServices(),
					catch: (err) => new Error(`Failed to load folder preview services: ${String(err)}`),
				});

				const folderService = yield* FolderService;
				const folder = yield* folderService.getById(req.params.id);
				const baseUrl = `${req.protocol}://${req.get('host') ?? 'localhost:4000'}`;
				const max = sanitizePreviewCount(req.query.max);
				const previewFilesResult = yield* Effect.tryPromise({
					try: () =>
						getFolderFiles!({
							folderId: req.params.id,
							includeSubfolders: true,
							limit: max,
							offset: 0,
							sortBy: 'updatedAt',
							sortOrder: 'desc',
							fileTypes: ['image', 'video'],
						}),
					catch: (err) => new Error(`Failed to fetch folder preview files: ${String(err)}`),
				});

				return {
					folder,
					previewFiles: normalizePreviewFiles(previewFilesResult, baseUrl, max),
				};
			}).pipe(Effect.provide(FolderServiceLive)),
		{
			onSuccess: ({ folder, previewFiles }, res) => {
				const name = escapeXml(folder.name || 'Carpeta');
				const path = escapeXml(folder.path || '/');
				const totalFiles = folder.totalFiles ?? folder._count?.totalFiles ?? 0;
				const totalSize = formatBytes(folder.totalSize ?? 0);
				const svg = buildFolderPreviewSvg({
					previewFiles,
					name,
					path,
					totalFiles,
					totalSize: escapeXml(totalSize),
				});

				res.setHeader(
					'Cache-Control',
					process.env.NODE_ENV === 'development'
						? 'no-store, max-age=0'
						: 'public, max-age=3600, stale-while-revalidate=86400'
				);
				res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
				res.status(200).send(svg);
			},
		}
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

			serverLogger.debug('Reindexando carpeta específica', { folderId, options });

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
			serverLogger.debug('Reindexando desde endpoint /reindex (legacy)', { folderId });

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

export default router;
