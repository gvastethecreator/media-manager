/**
 * @file Express Routes para Images usando Effect
 * @module server/routes/images.effect
 * @description Rutas REST para Images implementadas con Effect-TS
 * @created 2025-10-11 - Phase 6.1 ImageService Effect Implementation
 */

import { readFile } from 'node:fs/promises';
import { Effect } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { setAuthorizedAssetCacheHeaders } from '@/server/security/authorized-asset-cache';
import {
	authorizeMediaAssetBodyIds,
	authorizeMediaAssetParam,
	authorizeMediaPathInput,
	authorizeMediaPlacementInput,
	filterAuthorizedMediaEntities,
	authorizeFolderPathById,
	getAuthorizedRootRegistry,
	sendRootAuthorizationError,
} from '@/server/security/authorized-root-request';
import {
	countAuthorizedMediaAssetsByFolder,
	resolveMediaAssetReference,
} from '@/server/security/media-asset-reference';
import { sanitizeJsonResponses } from '@/server/security/sanitize-public-payload';
import { ImageService, type ImageServiceInterface, ImageServiceLive } from '@/services/image/image.service.effect';
import { TagService, TagServiceLive } from '@/services/tag/tag.service.effect';
import { sanitizeLimit, sanitizeOffset, validateBatchSize } from '../utils/pagination';
import { sendEffectHttpError } from '../utils/content-delivery';
import { getMimeTypeFromPath } from '../utils/mime';

const router = express.Router();

const rejectImagePlacementMutation: express.RequestHandler = (req, res, next) => {
	const body = req.body;
	if (body && typeof body === 'object' && ('folderId' in body || 'path' in body || 'source' in body)) {
		res.status(410).json({
			code: 'DOMAIN_OPERATION_REQUIRED',
			message: 'La ubicación de una imagen sólo cambia mediante la operación autorizada de move/rename por asset.',
			retryable: false,
		});
		return;
	}
	next();
};
const authorizeImageRestore: express.RequestHandler = async (req, res, next) => {
	try {
		const registry = getAuthorizedRootRegistry(req);
		for (const permission of ['read', 'write'] as const) {
			await resolveMediaAssetReference(registry, { assetId: req.params.id, assetType: 'image' }, permission, {
				allowDeleted: true,
				allowMissing: true,
			});
		}
		next();
	} catch (error) {
		if (!sendRootAuthorizationError(res, error)) next(error);
	}
};
router.use(sanitizeJsonResponses);
type ImageListOptions = NonNullable<Parameters<ImageServiceInterface['getAll']>[0]>;

function listAuthorizedImages(
	request: { app: { locals: Record<string, unknown> } },
	service: ImageServiceInterface,
	options: ImageListOptions,
	page: { limit: number; offset: number }
) {
	return Effect.gen(function* () {
		const authorized = [];
		let rawOffset = 0;
		while (true) {
			const chunk = yield* service.getAll({ ...options, limit: 500, offset: rawOffset });
			authorized.push(
				...(yield* Effect.promise(() =>
					filterAuthorizedMediaEntities(request, chunk.images, 'image', ['read', 'index'])
				))
			);
			rawOffset += chunk.images.length;
			if (!chunk.hasMore || chunk.images.length === 0) break;
		}
		return {
			hasNext: page.offset + page.limit < authorized.length,
			items: authorized.slice(page.offset, page.offset + page.limit),
			total: authorized.length,
		};
	});
}

async function sendAuthorizedOriginal(
	req: { app: { locals: Record<string, unknown> }; params: Record<string, string> },
	res: express.Response
): Promise<void> {
	try {
		const resolved = await resolveMediaAssetReference(
			getAuthorizedRootRegistry(req),
			{ assetId: req.params.id, assetType: 'image' },
			'read'
		);
		const buffer = await readFile(resolved.absolutePath);
		res.set({
			'Content-Length': buffer.length.toString(),
			'Content-Type': getMimeTypeFromPath(resolved.absolutePath),
		});
		setAuthorizedAssetCacheHeaders(res, 'revalidate');
		res.send(buffer);
	} catch (error) {
		if (!sendRootAuthorizationError(res, error)) sendEffectHttpError(res, error);
	}
}

/**
 * GET /images - Listar imágenes con filtros y paginación
 */
router.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const imageService = yield* ImageService;

			const {
				search,
				limit = '50',
				offset = '0',
				sortBy = 'createdAt',
				sortOrder = 'desc',
				folderId,
				isFavorite,
				minWidth,
				maxWidth,
				minHeight,
				maxHeight,
				minSize,
				maxSize,
				aiEngine,
				aiModel,
				aiOriginDetected,
			} = req.query;

			const options = {
				search: search as string | undefined,
				limit: sanitizeLimit(limit as string),
				offset: sanitizeOffset(offset as string),
				orderBy: (sortBy as 'name' | 'createdAt' | 'updatedAt' | 'size' | 'width' | 'height') || 'createdAt',
				orderDirection: (sortOrder as 'asc' | 'desc') || 'desc',
				folderId: folderId as string | undefined,
				isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
				minWidth: minWidth ? Number.parseInt(minWidth as string, 10) : undefined,
				maxWidth: maxWidth ? Number.parseInt(maxWidth as string, 10) : undefined,
				minHeight: minHeight ? Number.parseInt(minHeight as string, 10) : undefined,
				maxHeight: maxHeight ? Number.parseInt(maxHeight as string, 10) : undefined,
				minSize: minSize ? Number.parseInt(minSize as string, 10) : undefined,
				maxSize: maxSize ? Number.parseInt(maxSize as string, 10) : undefined,
				aiEngine: aiEngine as string | undefined,
				aiModel: aiModel as string | undefined,
				aiOriginDetected: aiOriginDetected === 'true' ? true : aiOriginDetected === 'false' ? false : undefined,
			};

			const result = yield* listAuthorizedImages(req, imageService, options, {
				limit: options.limit,
				offset: options.offset,
			});

			const data = result.items.map((image) => ({
				...image,
				entityType: 'image' as const,
				thumbnailUrl: `/api/images/${image.id}/thumbnail`,
			}));

			return {
				data,
				pagination: {
					total: result.total,
					limit: options.limit,
					offset: options.offset,
					hasNext: result.hasNext,
					hasPrev: options.offset > 0,
				},
			};
		}).pipe(Effect.provide(ImageServiceLive))
	)
);

/**
 * GET /images/favorites - Listar solo imágenes favoritas
 */
router.get(
	'/favorites',
	effectHandler((req) =>
		Effect.gen(function* () {
			const imageService = yield* ImageService;
			const { limit = '50', offset = '0', sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

			const filters = {
				search: search as string | undefined,
				limit: sanitizeLimit(limit as string),
				offset: sanitizeOffset(offset as string),
				sortBy: (sortBy as 'name' | 'size' | 'createdAt' | 'updatedAt') || 'createdAt',
				sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
			};

			const favoriteResult = yield* listAuthorizedImages(
				req,
				imageService,
				{
					isFavorite: true,
					orderBy: filters.sortBy,
					orderDirection: filters.sortOrder,
					search: filters.search,
				},
				{
					limit: filters.limit,
					offset: filters.offset,
				}
			);

			const data = favoriteResult.items.map((image) => ({
				...image,
				entityType: 'image' as const,
				thumbnailUrl: `/api/images/${image.id}/thumbnail`,
			}));
			return {
				data,
				pagination: {
					total: favoriteResult.total,
					limit: filters.limit,
					offset: filters.offset,
					hasNext: favoriteResult.hasNext,
					hasPrev: filters.offset > 0,
				},
			};
		}).pipe(Effect.provide(ImageServiceLive))
	)
);

/**
 * GET /images/by-hash/:hash - Buscar imagen por hash SHA-256
 */
router.get(
	'/by-hash/:hash',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const imageService = yield* ImageService;
			const candidates = yield* imageService.getByHashCandidates(req.params.hash);
			const [image] = yield* Effect.promise(() =>
				filterAuthorizedMediaEntities(req, candidates, 'image', ['read', 'index'])
			);
			if (!image) {
				res.status(404).json({ error: 'NOT_FOUND', message: 'Imagen no encontrada' });
				return;
			}
			return image;
		}).pipe(Effect.provide(ImageServiceLive))
	)
);

/**
 * GET /images/folder/:folderId - Listar imágenes de una carpeta
 */
router.get(
	'/folder/:folderId',
	authorizeFolderPathById('index'),
	effectHandler((req) =>
		Effect.gen(function* () {
			const imageService = yield* ImageService;

			const { limit, offset } = req.query;

			const options = {
				limit: sanitizeLimit(limit as string),
				offset: sanitizeOffset(offset as string),
			};

			const result = yield* listAuthorizedImages(req, imageService, { folderId: req.params.folderId }, options);

			return { data: result.items, pagination: { ...options, total: result.total, hasNext: result.hasNext } };
		}).pipe(Effect.provide(ImageServiceLive))
	)
);

/**
 * GET /images/folder/:folderId/count - Contar imágenes en una carpeta
 */
router.get(
	'/folder/:folderId/count',
	authorizeFolderPathById('index'),
	effectHandler((req) =>
		Effect.gen(function* () {
			const count = yield* Effect.promise(() =>
				countAuthorizedMediaAssetsByFolder(getAuthorizedRootRegistry(req), 'image', req.params.folderId, 'index')
			);
			return { count };
		}).pipe(Effect.provide(ImageServiceLive))
	)
);

/**
 * POST /images - Crear nueva imagen
 */
router.post(
	'/',
	authorizeMediaPathInput({ expected: 'file', required: true }),
	authorizeMediaPlacementInput(),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const imageService = yield* ImageService;

			// El servicio validará el input internamente con ImageCreateInput.make()
			const image = yield* imageService.create(req.body);
			res.status(201);
			return image;
		}).pipe(Effect.provide(ImageServiceLive))
	)
);

/**
 * GET /images/:id/stats - Obtener imagen con estadísticas completas
 */
router.get(
	'/:id/stats',
	authorizeMediaAssetParam({ assetType: 'image', permissions: ['read', 'index'] }),
	effectHandler((req) =>
		Effect.gen(function* () {
			const imageService = yield* ImageService;
			const imageWithStats = yield* imageService.getByIdWithStats(req.params.id);
			return imageWithStats;
		}).pipe(Effect.provide(ImageServiceLive))
	)
);

/**
 * PATCH /images/:id - Actualizar campos de una imagen
 */
router.patch(
	'/:id',
	authorizeMediaAssetParam({ assetType: 'image', permissions: ['read', 'write'] }),
	rejectImagePlacementMutation,
	effectHandler((req) =>
		Effect.gen(function* () {
			const imageService = yield* ImageService;

			// El servicio validará el input internamente con ImageUpdateInput.make()
			const image = yield* imageService.update(req.params.id, req.body);
			return image;
		}).pipe(Effect.provide(ImageServiceLive))
	)
);

/**
 * POST /images/:id/tags - Agregar tags a una imagen
 */
router.post(
	'/:id/tags',
	authorizeMediaAssetParam({ assetType: 'image', permissions: ['read', 'write'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const tagService = yield* TagService;
			const tagIds = Array.isArray(req.body?.tagIds) ? req.body.tagIds : [];
			const result = yield* tagService.addToImage(req.params.id, tagIds);
			res.status(201);
			return { success: true, added: result.added };
		}).pipe(Effect.provide(TagServiceLive))
	)
);

/**
 * DELETE /images/batch - Eliminar múltiples imágenes
 */
router.delete(
	'/batch',
	authorizeMediaAssetBodyIds({ allowMissing: true, assetType: 'image', permissions: ['delete'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const imageService = yield* ImageService;

			const { ids } = req.body;
			const force = req.query.force === 'true';

			validateBatchSize(ids);

			yield* imageService.deleteManyByIds(ids, { force });
			res.status(204);
			return undefined;
		}).pipe(Effect.provide(ImageServiceLive))
	)
);

/**
 * POST /images/:id/restore - Restaurar un tombstone canónico
 */
router.post(
	'/:id/restore',
	authorizeImageRestore,
	effectHandler((req) =>
		Effect.gen(function* () {
			const imageService = yield* ImageService;
			return yield* imageService.restoreById(req.params.id);
		}).pipe(Effect.provide(ImageServiceLive))
	)
);

/**
 * DELETE /images/:id - Eliminar imagen
 */
router.delete(
	'/:id',
	authorizeMediaAssetParam({ allowMissing: true, assetType: 'image', permissions: ['delete'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const imageService = yield* ImageService;

			const force = req.query.force === 'true';

			yield* imageService.deleteById(req.params.id, { force });
			res.status(204);
			return undefined;
		}).pipe(Effect.provide(ImageServiceLive))
	)
);

/**
 * POST /images/:id/thumbnail/generate - Generar thumbnail manualmente
 */
router.post(
	'/:id/thumbnail/generate',
	authorizeMediaAssetParam({ assetType: 'image', permissions: ['read', 'index'] }),
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const imageService = yield* ImageService;
			yield* imageService.generateThumbnail(req.params.id, res.locals.authorizedAssetPath);
			return { success: true, message: 'Thumbnail generated' };
		}).pipe(Effect.provide(ImageServiceLive))
	)
);

/**
 * GET /images/:id/thumbnail - Obtener thumbnail (genera si no existe)
 */
router.get(
	'/:id/thumbnail',
	authorizeMediaAssetParam({ assetType: 'image', permissions: ['read', 'index'] }),
	async (req, res) => {
		const effect = Effect.gen(function* () {
			const imageService = yield* ImageService;
			const buffer = yield* imageService.getThumbnail(req.params.id, res.locals.authorizedAssetPath);
			return buffer;
		}).pipe(Effect.provide(ImageServiceLive));

		try {
			const buffer = await Effect.runPromise(effect);
			res.set('Content-Type', 'image/webp');
			setAuthorizedAssetCacheHeaders(res, 'revalidate');
			res.send(buffer);
		} catch (error) {
			sendEffectHttpError(res, error);
		}
	}
);

/**
 * GET /images/:id/content - Obtener imagen original (Alias de /original para compatibilidad)
 */
router.get('/:id/content', sendAuthorizedOriginal);

/**
 * GET /images/:id/original - Obtener imagen original
 */
router.get('/:id/original', sendAuthorizedOriginal);

/**
 * GET /images/:id - Obtener imagen por ID (sin stats)
 * IMPORTANTE: Esta ruta debe ir AL FINAL para no interceptar rutas específicas
 */
router.get(
	'/:id',
	authorizeMediaAssetParam({ assetType: 'image', permissions: ['read', 'index'] }),
	effectHandler((req) =>
		Effect.gen(function* () {
			const imageService = yield* ImageService;
			const image = yield* imageService.getById(req.params.id);
			return image;
		}).pipe(Effect.provide(ImageServiceLive))
	)
);

export default router;
