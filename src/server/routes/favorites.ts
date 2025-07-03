import express from 'express';
import { FavoriteService } from '@/services/favorite/favorite.service';
import { toFavoriteWithStats } from '@/transformers/favorite/favorite.transformer';

const router = express.Router();
const favoriteService = new FavoriteService();

// GET /favorites - Listar favorites con filtros
router.get('/', async (req, res) => {
	try {
		const { search, limit = '50', offset = '0', sortBy = 'name', sortOrder = 'asc' } = req.query;

		const filters = {
			search: search as string,
			limit: Number.parseInt(limit as string),
			offset: Number.parseInt(offset as string),
			sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
			sortOrder: sortOrder as 'asc' | 'desc',
		};

		const { favorites, total } = await favoriteService.getFavorites(filters);
		const transformedFavorites = favorites.map(toFavoriteWithStats);

		res.json({
			data: transformedFavorites,
			pagination: {
				total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: filters.offset + filters.limit < total,
				hasPrev: filters.offset > 0,
			},
		});
	} catch (error) {
		console.error('Error getting favorites:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /favorites/:id - Obtener favorite por ID
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const favorite = await favoriteService.getFavoriteById(id);

		if (!favorite) {
			return res.status(404).json({ error: 'Favorite no encontrado' });
		}

		res.json(toFavoriteWithStats(favorite));
	} catch (error) {
		console.error('Error getting favorite:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// GET /favorites/:id/images - Obtener imágenes del favorite
router.get('/:id/images', async (req, res) => {
	try {
		const { id } = req.params;
		const { limit = '50', offset = '0', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

		const filters = {
			limit: Number.parseInt(limit as string),
			offset: Number.parseInt(offset as string),
			sortBy: sortBy as 'name' | 'createdAt' | 'updatedAt',
			sortOrder: sortOrder as 'asc' | 'desc',
		};

		const { images, total } = await favoriteService.getFavoriteImages(id, filters);

		res.json({
			data: images,
			pagination: {
				total,
				limit: filters.limit,
				offset: filters.offset,
				hasNext: filters.offset + filters.limit < total,
				hasPrev: filters.offset > 0,
			},
		});
	} catch (error) {
		console.error('Error getting favorite images:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /favorites - Crear nuevo favorite
router.post('/', async (req, res) => {
	try {
		const { name, description, isPublic } = req.body;

		if (!name) {
			return res.status(400).json({ error: 'El nombre es requerido' });
		}

		const favorite = await favoriteService.createFavorite({
			name,
			description,
			isPublic,
		});

		res.status(201).json(toFavoriteWithStats(favorite));
	} catch (error) {
		console.error('Error creating favorite:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// PUT /favorites/:id - Actualizar favorite
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description, isPublic } = req.body;

		const favorite = await favoriteService.updateFavorite(id, {
			name,
			description,
			isPublic,
		});

		if (!favorite) {
			return res.status(404).json({ error: 'Favorite no encontrado' });
		}

		res.json(toFavoriteWithStats(favorite));
	} catch (error) {
		console.error('Error updating favorite:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /favorites/:id - Eliminar favorite
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const deleted = await favoriteService.deleteFavorite(id);

		if (!deleted) {
			return res.status(404).json({ error: 'Favorite no encontrado' });
		}

		res.status(204).send();
	} catch (error) {
		console.error('Error deleting favorite:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// POST /favorites/:id/images/:imageId - Agregar imagen al favorite
router.post('/:id/images/:imageId', async (req, res) => {
	try {
		const { id, imageId } = req.params;

		await favoriteService.addImageToFavorite(id, imageId);

		res.status(201).json({ message: 'Imagen agregada a favoritos correctamente' });
	} catch (error) {
		console.error('Error adding image to favorite:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

// DELETE /favorites/:id/images/:imageId - Remover imagen del favorite
router.delete('/:id/images/:imageId', async (req, res) => {
	try {
		const { id, imageId } = req.params;

		await favoriteService.removeImageFromFavorite(id, imageId);

		res.status(204).send();
	} catch (error) {
		console.error('Error removing image from favorite:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;
