import express from 'express';
import { db, getDbClient } from '@/lib/drizzle';
import { files } from '@/lib/drizzle/schema/index';
import { like, or, sql } from 'drizzle-orm';
import { searchImages } from '../services/search.service';

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
			items = await searchImages(query, Number.parseInt(limit as string));
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
		const items = await searchImages(query, Number.parseInt(limit as string));
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

		const start = Date.now();

		// Intentar FTS5 primero (requiere tabla virtual files_fts)
		let rows: any[] = [];
		let total = 0;
		let used = 'fts5';
		try {
			const client = getDbClient();
			if (!client || typeof client.execute !== 'function') throw new Error('client.execute no disponible');
			const match = q.replace(/\"/g, '');
			const querySql = `
				SELECT f.id, f.name, f.path, f.tags
				FROM files_fts ft
				JOIN File f ON f.rowid = ft.rowid
				WHERE ft MATCH ?
				LIMIT ? OFFSET ?`;
			const result = await client.execute({ sql: querySql, args: [match, limit, offset] });
			rows = result.rows.map((r: any) => ({
				id: String(r[0]),
				name: String(r[1]),
				path: String(r[2]),
				tags: String((r[3] ?? '[]')),
			}));
			// total aproximado: contar más resultados puede ser caro; devolvemos page size como proxy y flag
			total = rows.length + offset;
		} catch (_e) {
			// Fallback a LIKE en Drizzle
			used = 'like';
			const likeTerm = `%${q}%`;
			const data = await db
				.select({ id: files.id, name: files.name, path: files.path, tags: files.tags })
				.from(files)
				.where(or(like(files.name, likeTerm), like(files.path, likeTerm)))
				.limit(limit)
				.offset(offset);
			rows = data.map((r: any) => ({ id: r.id, name: r.name, path: r.path, tags: r.tags || '[]' }));
			// Estimar total con COUNT simple (opcional)
			const countResult = await db
				.select({ c: sql`COUNT(1)` })
				.from(files)
				.where(or(like(files.name, likeTerm), like(files.path, likeTerm)));
			total = Number(countResult?.[0]?.c ?? rows.length);
		}

		const took = Date.now() - start;

		res.json({
			items: rows,
			total,
			query: q,
			took,
			engine: used,
		});
	} catch (error) {
		console.error('Error en /search/fts:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});
