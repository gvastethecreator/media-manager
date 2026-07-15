/**
 * @file Express Routes para Search usando Effect
 * @module server/routes/search.effect
 * @description Rutas REST para búsqueda implementadas con Effect-TS
 * @created 2026-02-02 - Migración desde search.ts
 */

import { Context, Data, Effect, Layer } from 'effect';
import express from 'express';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import {
	assertAuthorizedMediaEntity,
	filterAuthorizedMediaEntities,
	getAuthorizedRootRegistry,
} from '@/server/security/authorized-root-request';
import { RootAuthorizationError } from '@/server/security/authorized-roots';
import { sanitizeJsonResponses } from '@/server/security/sanitize-public-payload';
import {
	performSearch,
	SearchFilesResult,
	SearchResponse,
	searchFilesFts,
	searchImages,
} from '../services/search.service';
import { sanitizeLimit, sanitizeOffset } from '../utils/pagination';

// ==========================================
// 1. Definir errores tipados
// ==========================================

export class SearchQueryRequired extends Data.TaggedError('SearchQueryRequired')<{
	readonly message: string;
}> {}

export class SearchFailed extends Data.TaggedError('SearchFailed')<{
	readonly message: string;
}> {}

export class FtsNotAvailable extends Data.TaggedError('FtsNotAvailable')<{
	readonly message: string;
}> {}

// ==========================================
// 2. Crear servicio Effect
// ==========================================

export interface SearchServiceInterface {
	readonly performSearch: (
		query: string,
		type: 'all' | 'image' | 'video' | 'audio' | 'document',
		limit: number,
		offset: number
	) => Effect.Effect<SearchResponse & { took: number; engine: string }, SearchFailed>;
	readonly searchFilesFts: (
		query: string,
		limit: number,
		offset: number,
		ftsRequired: boolean
	) => Effect.Effect<SearchFilesResult & { took: number; engine: string }, FtsNotAvailable | SearchFailed>;
	readonly searchImages: (
		query: string,
		limit: number,
		offset?: number
	) => Effect.Effect<
		{ items: unknown[]; results: unknown[]; total: number; query: string; took: number; engine: string },
		SearchFailed
	>;
}

export class SearchService extends Context.Tag('SearchService')<SearchService, SearchServiceInterface>() {}

// ==========================================
// 3. Implementar Live Layer
// ==========================================

export const SearchServiceLive = Layer.succeed(
	SearchService,
	SearchService.of({
		performSearch: (
			query: string,
			type: 'all' | 'image' | 'video' | 'audio' | 'document',
			limit: number,
			offset: number
		) =>
			Effect.tryPromise({
				try: async () => {
					const startTime = Date.now();
					const searchResults = await performSearch(query, type, limit, offset);
					const took = Date.now() - startTime;
					return { ...searchResults, took, engine: 'like' };
				},
				catch: (error) =>
					new SearchFailed({
						message: error instanceof Error ? error.message : 'Error en búsqueda',
					}),
			}),

		searchImages: (query: string, limit: number, offset = 0) =>
			Effect.tryPromise({
				try: async () => {
					const startTime = Date.now();
					const items = await searchImages(query, limit, offset);
					const took = Date.now() - startTime;
					return {
						items,
						results: items,
						total: items.length,
						query,
						took,
						engine: 'like',
					};
				},
				catch: (error) =>
					new SearchFailed({
						message: error instanceof Error ? error.message : 'Error en búsqueda de imágenes',
					}),
			}),

		searchFilesFts: (query: string, limit: number, offset: number, ftsRequired: boolean) =>
			Effect.tryPromise({
				try: async () => {
					const started = performance.now();
					const result = await searchFilesFts(query, limit, offset);

					// Si se requiere FTS pero se usó LIKE fallback
					if (ftsRequired && result.engine === 'like') {
						throw new FtsNotAvailable({ message: 'FTS no disponible' });
					}

					const took = performance.now() - started;
					return { ...result, took: Math.round(took * 100) / 100, engine: result.engine };
				},
				catch: (error) => {
					if (error instanceof FtsNotAvailable) {
						return error;
					}
					return new SearchFailed({
						message: error instanceof Error ? error.message : 'Error en búsqueda FTS',
					});
				},
			}),
	})
);

// ==========================================
// 4. Crear Router Express
// ==========================================

const router = express.Router();
router.use(sanitizeJsonResponses);
const logger = serverLogger.withContext('SearchRoute');

/**
 * GET /search - Búsqueda global (UNIFICADA)
 */
router.get(
	'/',
	effectHandler((req) =>
		Effect.gen(function* () {
			const { q, query, limit = '50', offset = '0', type = 'all' } = req.query;
			const searchQuery = (q || query) as string;

			if (!searchQuery || typeof searchQuery !== 'string') {
				return { query: '', type: 'all', total: 0, results: [], took: 0, engine: 'like' };
			}

			const parsedLimit = Math.min(100, sanitizeLimit(limit));
			const parsedOffset = Math.max(0, sanitizeOffset(offset));
			const validTypes = ['all', 'image', 'video', 'audio', 'document'];
			const searchType = validTypes.includes(type as string)
				? (type as 'all' | 'image' | 'video' | 'audio' | 'document')
				: 'all';

			const searchService = yield* SearchService;
			const authorizedResults: SearchResponse['results'] = [];
			let took = 0;
			let engine = 'like';
			const scanTypes = searchType === 'all' ? (['image', 'video', 'audio', 'document'] as const) : [searchType];
			for (const scanType of scanTypes) {
				let rawOffset = 0;
				const chunkSize = 500;
				while (true) {
					const chunk = yield* searchService.performSearch(searchQuery, scanType, chunkSize, rawOffset);
					took += chunk.took;
					engine = chunk.engine;
					const decisions = yield* Effect.promise(() =>
						Promise.all(
							chunk.results.map(async (item) => {
								try {
									await assertAuthorizedMediaEntity(req, item.data, item.type, ['read', 'index']);
									return true;
								} catch (error) {
									if (error instanceof RootAuthorizationError) return false;
									throw error;
								}
							})
						)
					);
					authorizedResults.push(...chunk.results.filter((_item, index) => decisions[index]));
					rawOffset += chunk.results.length;
					if (chunk.results.length < chunkSize) break;
				}
			}
			return {
				query: searchQuery,
				type: searchType,
				results: authorizedResults.slice(parsedOffset, parsedOffset + parsedLimit),
				total: authorizedResults.length,
				took,
				engine,
			};
		}).pipe(Effect.provide(SearchServiceLive))
	)
);

/**
 * GET /search/images - Búsqueda específica de imágenes
 */
router.get(
	'/images',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { query, limit = '100' } = req.query;

			if (!query || typeof query !== 'string') {
				res.status(400).json({ error: 'El parámetro query es requerido' });
				return undefined;
			}

			const requestedLimit = sanitizeLimit(limit, 100, 500);
			const searchService = yield* SearchService;
			const authorizedItems: Array<{ id?: unknown; path?: unknown }> = [];
			let rawOffset = 0;
			let took = 0;
			const chunkSize = 500;
			while (true) {
				const chunk = yield* searchService.searchImages(query, chunkSize, rawOffset);
				took += chunk.took;
				const candidates = chunk.items.filter((item): item is { id?: unknown; path?: unknown } =>
					Boolean(item && typeof item === 'object')
				);
				authorizedItems.push(
					...(yield* Effect.promise(() => filterAuthorizedMediaEntities(req, candidates, 'image', ['read', 'index'])))
				);
				rawOffset += chunk.items.length;
				if (chunk.items.length < chunkSize) break;
			}
			const items = authorizedItems.slice(0, requestedLimit);
			return { items, results: items, total: authorizedItems.length, query, took, engine: 'like' };
		}).pipe(Effect.provide(SearchServiceLive))
	)
);

/**
 * GET /search/fts - Búsqueda FTS5 sobre File
 */
router.get(
	'/fts',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const q = typeof req.query.q === 'string' ? req.query.q : undefined;
			const limit = sanitizeLimit(req.query.limit, 50);
			const offset = sanitizeOffset(req.query.offset);

			if (!q || q.trim().length === 0) {
				res.status(400).json({ error: 'El parámetro q es requerido' });
				return undefined;
			}

			const ftsRequired = process.env.SEARCH_FTS_REQUIRE === '1';

			const searchService = yield* SearchService;
			const authorizedItems: SearchFilesResult['items'] = [];
			const registry = getAuthorizedRootRegistry(req);
			let rawOffset = 0;
			let engine = 'like';
			let took = 0;
			while (true) {
				const result = yield* searchService.searchFilesFts(q, 500, rawOffset, ftsRequired);
				engine = result.engine;
				took += result.took;
				const decisions = yield* Effect.promise(() =>
					Promise.all(
						result.items.map(async (item) => {
							try {
								await registry.authorizeAbsolutePath(item.path, 'read');
								await registry.authorizeAbsolutePath(item.path, 'index');
								return true;
							} catch (error) {
								if (error instanceof RootAuthorizationError) return false;
								throw error;
							}
						})
					)
				);
				authorizedItems.push(...result.items.filter((_item, index) => decisions[index]));
				rawOffset += result.items.length;
				if (result.items.length === 0 || rawOffset >= result.total) break;
			}
			return { engine, took, items: authorizedItems.slice(offset, offset + limit), total: authorizedItems.length };
		}).pipe(Effect.provide(SearchServiceLive))
	)
);

export default router;
export { router as searchEffectRouter };
