import { CollectionService } from '@/services/collection/collection.service';
import { ImageService } from '@/services/image/image.service';
import { toCollectionWithStats } from '@/transformers/collection/collection.transformer';
import { toImageWithStats } from '@/transformers/image/image.transformer';
import express from 'express';

const router = express.Router();
const collectionService = new CollectionService();
const imageService = new ImageService();

// GET /collections - Listar colecciones con filtros
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

		const { collections, total } = await collectionService.getCollections(filters);
		const transformedCollections = collections.map(toCollectionWithStats);

		res.json({
			data: transformedCollections,
			pagination: {
				total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: filters.offset + filters.limit < total,
				hasPrev: filters.offset > 0,
			},
		});
	} catch (error) {
		console.error('Error getting collections:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /collections/:id - Obtener colección por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const collection = await collectionService.getCollectionById(id);

		if (!collection) {
			return res.status(404).json({ error: 'Colección no encontrada' });
		}

		res.json(toCollectionWithStats(collection));
	} catch (error) {
		console.error('Error getting collection:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /collections/:id/images - Obtener imágenes de una colección
router.get('/:id/images', async (req, res) => {
	try {
		const { id } = req.params;
		const images = await collectionService.getCollectionImages(id);
		const transformedImages = images.map(toImageWithStats);

		res.json(transformedImages);
	} catch (error) {
		console.error('Error getting collection images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /collections/:id/images/all - Compatibilidad con Next.js
router.get('/:id/images/all', async (req, res) => {
	try {
		const { id } = req.params;
		const images = await collectionService.getCollectionImages(id);
		const transformedImages = images.map(toImageWithStats);
		res.json({ items: transformedImages });
	} catch (error) {
		console.error('Error getting collection images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /collections - Crear nueva colección
router.post('/', async (req, res) => {
	try {
		const { name, description, color, isPrivate } = req.body;

		if (!name) {
			return res.status(400).json({ error: 'El nombre es requerido' });
		}

		const collection = await collectionService.createCollection({
			name,
			description,
			color,
			isPrivate: isPrivate || false,
		});

		res.status(201).json(toCollectionWithStats(collection));
	} catch (error) {
		console.error('Error creating collection:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /collections/:id - Actualizar colección
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description, color, isPrivate } = req.body;

		const collection = await collectionService.updateCollection(id, {
			name,
			description,
			color,
			isPrivate,
		});

		if (!collection) {
			return res.status(404).json({ error: 'Colección no encontrada' });
		}

		res.json(toCollectionWithStats(collection));
	} catch (error) {
		console.error('Error updating collection:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /collections/:id - Eliminar colección
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const deleted = await collectionService.deleteCollection(id);

		if (!deleted) {
			return res.status(404).json({ error: 'Colección no encontrada' });
		}

		res.status(204).send();
	} catch (error) {
		console.error('Error deleting collection:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /collections/:id/images/:imageId - Agregar imagen a colección
router.post('/:id/images/:imageId', async (req, res) => {
	try {
		const { id, imageId } = req.params;

		await collectionService.addImageToCollection(id, imageId);
		res.status(204).send();
	} catch (error) {
		console.error('Error adding image to collection:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /collections/:id/images/:imageId - Remover imagen de colección
router.delete('/:id/images/:imageId', async (req, res) => {
	try {
		const { id, imageId } = req.params;

		await collectionService.removeImageFromCollection(id, imageId);
		res.status(204).send();
	} catch (error) {
		console.error('Error removing image from collection:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
