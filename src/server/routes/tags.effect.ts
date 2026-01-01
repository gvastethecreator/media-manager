/**
 * @file Express Routes para Tags usando Effect
 * @module server/routes/tags.effect
 * @description Rutas REST para Tags implementadas con Effect-TS
 * @created 2025-10-11 - Fase 1 Effect Implementation
 */

import { Schema } from '@effect/schema';
import { Effect } from 'effect';
import express from 'express';
import { runEffectForExpress } from '@/lib/effect/adapters/express.adapter';
import { TagService, TagServiceLive } from '@/services/tag/tag.service.effect';
import { TagCreate, TagUpdate } from '@/services/tag/tag-schemas';

const router = express.Router();

/**
 * GET /tags - Listar tags con filtros
 */
router.get('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const tagService = yield* TagService;

		const { search, limit = '50', offset = '0', sortBy = 'name', sortOrder = 'asc', onlyFavorites } = req.query;

		const options = {
			search: search as string | undefined,
			limit: Number.parseInt(limit as string, 10),
			offset: Number.parseInt(offset as string, 10),
			orderBy: (sortBy as 'name' | 'createdAt' | 'updatedAt' | 'popularity') || 'name',
			orderDirection: (sortOrder as 'asc' | 'desc') || 'asc',
			onlyFavorites: onlyFavorites === 'true',
		};

		const result = yield* tagService.getAll(options);

		return {
			data: result.tags,
			pagination: {
				total: result.total,
				limit: result.limit,
				offset: result.offset,
				hasNext: result.hasMore,
				hasPrev: result.offset > 0,
			},
		};
	}).pipe(Effect.provide(TagServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * POST /tags - Crear nuevo tag
 */
router.post('/', async (req, res) => {
	const effect = Effect.gen(function* () {
		const tagService = yield* TagService;

		// Validar input
		const input = yield* Effect.try({
			try: () => Schema.decodeUnknownSync(TagCreate)(req.body),
			catch: (error) => new Error(`Validation failed: ${String(error)}`),
		});

		const tag = yield* tagService.create(input);
		return tag;
	}).pipe(Effect.provide(TagServiceLive));

	await runEffectForExpress(effect, res, { successStatus: 201 });
});

/**
 * PUT /tags/:id - Actualizar tag
 */
router.put('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const tagService = yield* TagService;

		// Validar input y agregar ID desde params
		const input = yield* Effect.try({
			try: () =>
				Schema.decodeUnknownSync(TagUpdate)({
					...req.body,
					id: req.params.id,
				}),
			catch: (error) => new Error(`Validation failed: ${String(error)}`),
		});

		const tag = yield* tagService.update(input);
		return tag;
	}).pipe(Effect.provide(TagServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * DELETE /tags/:id - Eliminar tag
 */
router.delete('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const tagService = yield* TagService;
		yield* tagService.delete(req.params.id);
		return { success: true };
	}).pipe(Effect.provide(TagServiceLive));

	await runEffectForExpress(effect, res, { successStatus: 204 });
});

/**
 * POST /tags/:id/favorite - Toggle favorite status
 */
router.post('/:id/favorite', async (req, res) => {
	const effect = Effect.gen(function* () {
		const tagService = yield* TagService;
		const tag = yield* tagService.toggleFavorite(req.params.id);
		return tag;
	}).pipe(Effect.provide(TagServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /tags/:id/images - Obtener imágenes asociadas a un tag
 */
router.get('/:id/images', async (req, res) => {
	const effect = Effect.gen(function* () {
		const tagService = yield* TagService;
		const images = yield* tagService.getImages(req.params.id);
		return images;
	}).pipe(Effect.provide(TagServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /tags/:id/thumbnails - Obtener thumbnails de imágenes asociadas a un tag
 */
router.get('/:id/thumbnails', async (req, res) => {
	const limit = Number(req.query.limit) || 6;
	const effect = Effect.gen(function* () {
		const tagService = yield* TagService;
		const thumbnails = yield* tagService.getThumbnails(req.params.id, limit);
		return thumbnails;
	}).pipe(Effect.provide(TagServiceLive));

	await runEffectForExpress(effect, res);
});

/**
 * GET /tags/:id - Obtener tag por ID
 * IMPORTANTE: Esta ruta debe ir AL FINAL para no interceptar rutas específicas como /:id/favorite
 */
router.get('/:id', async (req, res) => {
	const effect = Effect.gen(function* () {
		const tagService = yield* TagService;
		const tag = yield* tagService.getByIdWithStats(req.params.id);
		return tag;
	}).pipe(Effect.provide(TagServiceLive));

	await runEffectForExpress(effect, res);
});

export default router;
