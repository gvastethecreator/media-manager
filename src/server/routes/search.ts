import express from 'express';
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
