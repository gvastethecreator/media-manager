import express from 'express';
import { isFts5Enabled } from '@/lib/drizzle/fts5';
import { serverLogger } from '@/lib/logger/server-logger';
import { searchFilesFts, searchImages } from '../services/search.service';

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
			results: items,
			total: items.length,
			query,
			took,
			engine: 'like',
		});
	} catch (error) {
		serverLogger.error('Error in search:', error);
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
			results: items,
			total: items.length,
			query,
			took,
			engine: 'like',
		});
	} catch (error) {
		serverLogger.error('Error in image search:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

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
		if (process.env.SEARCH_FTS_REQUIRE === '1' && !isFts5Enabled()) {
			logger.error('FTS requerido pero no disponible');
			res.status(503).json({ error: 'FTS no disponible', required: true });
			return;
		}

		const started = performance.now();
		const result = await searchFilesFts(q, limit, offset);
		const took = performance.now() - started;
		res.json({
			items: result.items,
			results: result.items,
			total: result.total,
			query: q,
			took: Math.round(took * 100) / 100,
			engine: result.engine,
		});
	} catch (error) {
		logger.error('Error en /search/fts', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
