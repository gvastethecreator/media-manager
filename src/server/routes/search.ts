import { like, or, sql } from 'drizzle-orm';
import express from 'express';
import { db, getDbClient } from '@/lib/drizzle';
import { isFts5Enabled } from '@/lib/drizzle/fts5';
import { files } from '@/lib/drizzle/schema/index';
import { serverLogger } from '@/lib/logger/server-logger';
import { searchImages } from '../services/search.service';

const logger = serverLogger.withContext('SearchRoute');

const router = express.Router();

// GET /search - Búsqueda global
router.get('/', async (req, res) => {
	try {
		const { query, limit = '100', type = 'all', sortBy = 'relevance', sortOrder = 'desc' } = req.query;

		if (!query || typeof query !== 'string') {
			res.status(400).json({ error: 'El parámetro query es requerido' });
			return;
		}

		const startTime = Date.now();

		// Por ahora solo implementamos búsqueda de imágenes
		// TODO: Expandir para videos, audio, etc.
		let items: any[] = [];
		if (type === 'images' || type === 'all') {
			items = await searchImages(query, Number.parseInt(limit as string, 10));
		}

		const took = Date.now() - startTime;

		res.json({
			items,
			total: items.length,
			query,
			took,
		});
	} catch (error) {
		console.error('Error in search:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /search/images - Búsqueda específica de imágenes
router.get('/images', async (req, res) => {
	try {
		const { query, limit = '100' } = req.query;

		if (!query || typeof query !== 'string') {
			res.status(400).json({ error: 'El parámetro query es requerido' });
			return;
		}

		const startTime = Date.now();
		const items = await searchImages(query, Number.parseInt(limit as string, 10));
		const took = Date.now() - startTime;

		res.json({
			items,
			total: items.length,
			query,
			took,
		});
	} catch (error) {
		console.error('Error in image search:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;

// GET /search/fts - Búsqueda FTS5 sobre File
router.get('/fts', async (req, res) => {
	try {
		const q = typeof req.query.q === 'string' ? req.query.q : undefined;
		const limit = Number.parseInt((req.query.limit as string) || '50', 10);
		const offset = Number.parseInt((req.query.offset as string) || '0', 10);

		if (!q || q.trim().length === 0) {
			res.status(400).json({ error: 'El parámetro q es requerido' });
			return;
		}

		const started = performance.now();
		let rows: any[] = [];
		let total = 0;
		let engine: 'fts5' | 'like' = 'fts5';

		try {
			if (!isFts5Enabled()) {
				throw new Error('fts5-disabled');
			}
			const client = getDbClient();
			if (!client || typeof client.execute !== 'function') {
				throw new Error('client.execute no disponible');
			}
			const match = q.replace(/"/g, '');
			const querySql =
				'SELECT f.id, f.name, f.path, f.tags, bm25(files_fts) as score FROM files_fts ft JOIN File f ON f.rowid = ft.rowid WHERE ft MATCH ? ORDER BY score LIMIT ? OFFSET ?';
			const execStart = performance.now();
			const result = await client.execute({ sql: querySql, args: [match, limit, offset] });
			const execMs = performance.now() - execStart;
			rows = result.rows.map((r: any) => ({
				id: String(r[0]),
				name: String(r[1]),
				path: String(r[2]),
				tags: String(r[3] ?? '[]'),
				score: Number(r[4]),
			}));
			total = rows.length + offset; // estimación
			logger.debug('search.fts', { q, rows: rows.length, ms: Math.round(execMs * 100) / 100 });
		} catch (e: any) {
			// Si se exige FTS (flag) devolver 503
			if (process.env.SEARCH_FTS_REQUIRE === '1') {
				logger.error('FTS requerido pero no disponible', e);
				res.status(503).json({ error: 'FTS no disponible', required: true });
				return;
			}
			engine = 'like';
			const likeTerm = `%${q}%`;
			const execStart = performance.now();
			const data = await db
				.select({ id: files.id, name: files.name, path: files.path, tags: files.tags })
				.from(files)
				.where(or(like(files.name, likeTerm), like(files.path, likeTerm)))
				.limit(limit)
				.offset(offset);
			rows = data.map((r: any) => ({ id: r.id, name: r.name, path: r.path, tags: r.tags || '[]' }));
			const countResult = await db
				.select({ c: sql`COUNT(1)` })
				.from(files)
				.where(or(like(files.name, likeTerm), like(files.path, likeTerm)));
			total = Number(countResult?.[0]?.c ?? rows.length);
			const execMs = performance.now() - execStart;
			const reason = e?.message === 'fts5-disabled' ? 'disabled' : 'error';
			logger.info('search.like.fallback', { q, reason, rows: rows.length, ms: Math.round(execMs * 100) / 100 });
		}

		const took = performance.now() - started;
		res.json({ items: rows, total, query: q, took: Math.round(took * 100) / 100, engine });
	} catch (error) {
		logger.error('Error en /search/fts', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});
