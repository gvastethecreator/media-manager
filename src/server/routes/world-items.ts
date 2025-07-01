import { WorldItemService } from '@/services/world-item/world-item.service';
import { toImageWithStats } from '@/transformers/image/image.transformer';
import { toWorldItemWithStats } from '@/transformers/world-item/world-item.transformer';
import express from 'express';

const router = express.Router();
const worldItemService = new WorldItemService();

// GET /world-items - Listar world items con filtros
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

		const { worldItems, total } = await worldItemService.getWorldItems(filters);
		const transformedWorldItems = worldItems.map(toWorldItemWithStats);

		res.json({
			data: transformedWorldItems,
			pagination: {
				total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: filters.offset + filters.limit < total,
				hasPrev: filters.offset > 0,
			},
		});
	} catch (error) {
		console.error('Error getting world items:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /world-items/:id - Obtener world item por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const worldItem = await worldItemService.getWorldItemById(id);

		if (!worldItem) {
			return res.status(404).json({ error: 'World item no encontrado' });
		}

		res.json(toWorldItemWithStats(worldItem));
	} catch (error) {
		console.error('Error getting world item:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /world-items/:id/images - Obtener imágenes de un world item
router.get('/:id/images', async (req, res) => {
	try {
		const { id } = req.params;
		const images = await worldItemService.getWorldItemImages(id);
		const transformedImages = images.map(toImageWithStats);

		res.json(transformedImages);
	} catch (error) {
		console.error('Error getting world item images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /world-items - Crear nuevo world item
router.post('/', async (req, res) => {
	try {
		const { name, description, color, category, rarity } = req.body;

		if (!name) {
			return res.status(400).json({ error: 'El nombre es requerido' });
		}

		const worldItem = await worldItemService.createWorldItem({
			name,
			description,
			color,
			category,
			rarity,
		});

		res.status(201).json(toWorldItemWithStats(worldItem));
	} catch (error) {
		console.error('Error creating world item:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /world-items/:id - Actualizar world item
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description, color, category, rarity } = req.body;

		const worldItem = await worldItemService.updateWorldItem(id, {
			name,
			description,
			color,
			category,
			rarity,
		});

		if (!worldItem) {
			return res.status(404).json({ error: 'World item no encontrado' });
		}

		res.json(toWorldItemWithStats(worldItem));
	} catch (error) {
		console.error('Error updating world item:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /world-items/:id - Eliminar world item
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const deleted = await worldItemService.deleteWorldItem(id);

		if (!deleted) {
			return res.status(404).json({ error: 'World item no encontrado' });
		}

		res.status(204).send();
	} catch (error) {
		console.error('Error deleting world item:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
