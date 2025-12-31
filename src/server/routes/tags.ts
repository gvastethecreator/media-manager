import express from 'express';
import { serverLogger } from '@/lib/logger/server-logger';
import { TagService } from '@/services/tag/tag.service';
import { toImageWithStats } from '@/transformers/image';

const router = express.Router();
const tagService = new TagService();

// GET /tags - Listar tags con filtros
router.get('/', async (req, res) => {
	try {
		const { search, limit = '50', offset = '0', sortBy = 'name', sortOrder = 'asc' } = req.query;

		const filters = {
			search: search as string,
			limit: Number.parseInt(limit as string, 10),
			offset: Number.parseInt(offset as string, 10),
			sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
			sortOrder: sortOrder as 'asc' | 'desc',
		};

		const { tags, total } = await tagService.getTags(filters);
		// Los tags ya vienen como TagWithStats del servicio
		const transformedTags = tags;

		res.json({
			data: transformedTags,
			pagination: {
				total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: filters.offset + filters.limit < total,
				hasPrev: filters.offset > 0,
			},
		});
	} catch (error) {
		serverLogger.error('Error getting tags:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /tags/:id - Obtener tag por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const tag = await tagService.getTagById(id);

		if (!tag) {
			res.status(404).json({ error: 'Tag no encontrado' });
			return;
		}

		// El tag ya viene como TagWithStats del servicio
		res.json(tag);
	} catch (error) {
		serverLogger.error('Error getting tag:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /tags/:id/images - Obtener imágenes de un tag
router.get('/:id/images', async (req, res) => {
	try {
		const { id } = req.params;
		const images = await tagService.getTagImages(id);
		const transformedImages = images.map(toImageWithStats);

		res.json(transformedImages);
	} catch (error) {
		serverLogger.error('Error getting tag images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /tags/:id/thumbnails - Obtener thumbnails de un tag
router.get('/:id/thumbnails', async (req, res) => {
	try {
		const { id } = req.params;
		const limit = Number(req.query.limit) || 6;
		const thumbnails = await tagService.getTagThumbnails(id, limit);
		res.json(thumbnails);
	} catch (error) {
		serverLogger.error('Error getting tag thumbnails:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /tags/:id/stats - Obtener estadísticas de un tag
// TODO: Implementar getTagStats en TagService
/*
router.get('/:id/stats', async (req, res) => {
	try {
		const { id } = req.params;
		const stats = await tagService.getTagStats(id);
		if (!stats) {
			res.status(404).json({ error: 'Estadísticas de tag no encontradas' });; return;
		}
		res.json(stats);
	} catch (error) {
		serverLogger.error('Error getting tag stats:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});
*/

// POST /tags - Crear nuevo tag
router.post('/', async (req, res) => {
	try {
		const { name, description, color, emoji } = req.body;

		if (!name) {
			res.status(400).json({ error: 'El nombre es requerido' });
			return;
		}

		const tag = await tagService.createTag({
			name,
			description,
			color,
			emoji,
		});

		// El tag ya viene como TagWithStats del servicio
		res.status(201).json(tag);
	} catch (error) {
		serverLogger.error('Error creating tag:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /tags/:id - Actualizar tag
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description, color, emoji } = req.body;

		const tag = await tagService.updateTag(id, {
			name,
			description,
			color,
			emoji,
		});

		if (!tag) {
			res.status(404).json({ error: 'Tag no encontrado' });
			return;
		}

		// El tag ya viene como TagWithStats del servicio
		res.json(tag);
	} catch (error) {
		serverLogger.error('Error updating tag:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /tags/:id - Eliminar tag
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const deleted = await tagService.deleteTag(id);

		if (!deleted) {
			res.status(404).json({ error: 'Tag no encontrado' });
			return;
		}

		res.status(204).send();
	} catch (error) {
		serverLogger.error('Error deleting tag:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
