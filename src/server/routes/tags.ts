import { TagService } from '@/services/tag/tag.service';
import { toImageWithStats } from '@/transformers/image/image.transformer';
import { toTagWithStats } from '@/transformers/tag/tag.transformer';
import express from 'express';

const router = express.Router();
const tagService = new TagService();

// GET /tags - Listar tags con filtros
router.get('/', async (req, res) => {
	try {
		const { search, limit = '50', offset = '0', sortBy = 'name', sortOrder = 'asc' } = req.query;

		const filters = {
			search: search as string,
			limit: Number.parseInt(limit as string),
			offset: Number.parseInt(offset as string),
			sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt' | 'imageCount',
			sortOrder: sortOrder as 'asc' | 'desc',
		};

		const { tags, total } = await tagService.getTags(filters);
		const transformedTags = tags.map(toTagWithStats);

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
		console.error('Error getting tags:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /tags/:id - Obtener tag por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const tag = await tagService.getTagById(id);

		if (!tag) {
			return res.status(404).json({ error: 'Tag no encontrado' });
		}

		res.json(toTagWithStats(tag));
	} catch (error) {
		console.error('Error getting tag:', error);
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
		console.error('Error getting tag images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /tags - Crear nuevo tag
router.post('/', async (req, res) => {
	try {
		const { name, description, color, emoji } = req.body;

		if (!name) {
			return res.status(400).json({ error: 'El nombre es requerido' });
		}

		const tag = await tagService.createTag({
			name,
			description,
			color,
			emoji,
		});

		res.status(201).json(toTagWithStats(tag));
	} catch (error) {
		console.error('Error creating tag:', error);
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
			return res.status(404).json({ error: 'Tag no encontrado' });
		}

		res.json(toTagWithStats(tag));
	} catch (error) {
		console.error('Error updating tag:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /tags/:id - Eliminar tag
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const deleted = await tagService.deleteTag(id);

		if (!deleted) {
			return res.status(404).json({ error: 'Tag no encontrado' });
		}

		res.status(204).send();
	} catch (error) {
		console.error('Error deleting tag:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
